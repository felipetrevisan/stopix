"use client";

import {
  type Answer,
  type GameCommand,
  type GameOptions,
  type GameState,
  type Overtake,
  type GiftEffect,
  type Phase,
  type Player,
  applyGift,
  createGame,
  giftEffectFor,
  forceStop,
  isAnswerCandidate,
  parseCommand,
  restoreGame,
  skip,
  submitAnswer,
  tick,
} from "@stopix/game-core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ChatEvent,
  type ChatStatus,
  type GiftCatalog,
  type GiftEvent,
  connectDemoChat,
  connectNeonChat,
} from "./chat-source";
import { canonicalGiftName, giftImage } from "./gift-catalog";
import type { LiveSettings } from "./settings";

const storageKey = (cid: string) => `stopix:live:${cid}`;
const TICK_MS = 200;

const readSaved = (cid: string): GameState | null => {
  try {
    const raw = localStorage.getItem(storageKey(cid));
    return raw ? restoreGame(JSON.parse(raw)) : null;
  } catch {
    // Sem localStorage (navegador do LIVE Studio em modo privado): começa do zero.
    return null;
  }
};

const writeSaved = (cid: string, state: GameState) => {
  try {
    localStorage.setItem(storageKey(cid), JSON.stringify(state));
  } catch {
    // Idem.
  }
};

/** O que acabou de acontecer, para o overlay tocar som e mostrar alerta. */
export type GameFeedEvent =
  | { kind: "answer"; answer: Answer; overtake?: Overtake }
  | {
      kind: "gift";
      effect: GiftEffect;
      player: Player;
      giftName: string;
      image?: string;
      count: number;
      queued: boolean;
    }
  | { kind: "phase"; phase: Phase; state: GameState };

export type StopGame = {
  state: GameState | null;
  chat: ChatStatus;
  viewers: number;
  /** Imagens dos presentes já vistos na live (nome em minúsculas → imagem). */
  catalog: GiftCatalog;
  command: (command: GameCommand) => void;
};

const optionsOf = (settings: LiveSettings): GameOptions => ({
  roundSec: settings.roundSec,
  rounds: settings.rounds,
  intermissionSec: settings.intermissionSec,
  categories: settings.categories,
  hardLetters: settings.hardLetters,
  giftAmounts: settings.giftAmounts,
});

/** Motor da live: roda no overlay, no navegador do programa de live. */
export function useStopGame(
  settings: LiveSettings,
  onFeed?: (event: GameFeedEvent) => void,
): StopGame {
  const { cid, demo } = settings;
  const [state, setState] = useState<GameState | null>(null);
  const [chat, setChat] = useState<ChatStatus>("connecting");
  const [viewers, setViewers] = useState(0);
  const [catalog, setCatalog] = useState<GiftCatalog>({});

  const stateRef = useRef<GameState | null>(null);
  const optionsRef = useRef(optionsOf(settings));
  optionsRef.current = optionsOf(settings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const feedRef = useRef(onFeed);
  feedRef.current = onFeed;

  const commit = useCallback(
    (next: GameState) => {
      const previous = stateRef.current;
      if (next === previous) return;
      stateRef.current = next;
      setState(next);
      // A prévia e o demo não guardam: cada abertura começa uma partida nova.
      if (!demo) writeSaved(cid, next);
      if (next.phase !== previous?.phase || next.round.number !== previous?.round.number) {
        feedRef.current?.({ kind: "phase", phase: next.phase, state: next });
      }
    },
    [cid, demo],
  );

  // Começa (ou retoma: o OBS recarrega a fonte às vezes) e avança as fases no relógio.
  useEffect(() => {
    const now = Date.now();
    const saved = demo ? null : readSaved(cid);
    stateRef.current = null;
    commit(saved ?? createGame(now, optionsRef.current, Math.random));
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (current) commit(tick(current, Date.now(), optionsRef.current, Math.random));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [cid, demo, commit]);

  const command = useCallback(
    (name: GameCommand) => {
      const current = stateRef.current;
      if (!current) return;
      const now = Date.now();
      const options = optionsRef.current;
      if (name === "stop") commit(forceStop(current, now));
      else if (name === "skip") commit(skip(current, now, options, Math.random));
      else commit(createGame(now, options, Math.random, current.game + 1));
    },
    [commit],
  );

  const onChat = useCallback(
    (event: ChatEvent) => {
      const name = parseCommand(event.comment);
      if (name) {
        const { admins } = settingsRef.current;
        if (event.user.isModerator || admins.includes(event.user.handle)) command(name);
        return;
      }
      const current = stateRef.current;
      if (!current || current.phase !== "playing" || !isAnswerCandidate(event.comment)) return;
      const player = { id: event.user.id, name: event.user.name, avatar: event.user.avatar };
      const result = submitAnswer(current, player, event.comment, Date.now());
      if (result.outcome.type !== "accepted") return;
      commit(result.state);
      feedRef.current?.({
        kind: "answer",
        answer: result.outcome.answer,
        overtake: result.outcome.overtake,
      });
    },
    [command, commit],
  );

  const onGift = useCallback(
    (event: GiftEvent) => {
      const current = stateRef.current;
      const { gifts, giftNames, giftAmounts } = settingsRef.current;
      if (!current || !gifts) return;
      const giftName = canonicalGiftName(event.gift.name);
      const effect = giftEffectFor(giftName, giftNames);
      if (!effect) return;
      const result = applyGift(
        current,
        effect,
        event.count,
        Date.now(),
        optionsRef.current,
        giftAmounts,
        Math.random,
      );
      commit(result.state);
      feedRef.current?.({
        kind: "gift",
        effect,
        player: { id: event.user.id, name: event.user.name, avatar: event.user.avatar },
        giftName,
        image: giftImage(giftName) ?? event.gift.image,
        count: event.count,
        queued: result.result === "queued",
      });
    },
    [commit],
  );

  // Chat: Neon de verdade ou simulado.
  const demoGifts = settings.gifts ? Object.values(settings.giftNames).join("|") : "";
  useEffect(() => {
    const handlers = {
      onEvent: onChat,
      onStatus: setChat,
      onViewers: setViewers,
      onGift,
      onCatalog: setCatalog,
    };
    if (demo)
      return connectDemoChat(
        () => stateRef.current,
        handlers,
        demoGifts ? demoGifts.split("|") : [],
      );
    return connectNeonChat(cid, handlers);
  }, [cid, demo, onChat, onGift, demoGifts]);

  return { state, chat, viewers, catalog, command };
}
