"use client";

import {
  DEFAULT_PARTY_SETTINGS,
  type PartySettings,
  type PartyState,
  type RoundAnswers,
  type RoundVotes,
  createPartyState,
  finishReview,
  nextPartyRound,
  partyTick,
  requestStop,
  sanitizePartySettings,
  startParty,
  voteKey,
} from "@stopix/game-core";
import type { Database } from "firebase/database";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebaseConfigured, getFirebase } from "@/lib/firebase/client";
import {
  type Profile,
  type RoomPlayer,
  normalizePlayers,
  normalizeState,
  saveLastSettings,
  toDb,
} from "./room";

type Db = typeof import("firebase/database");

export type RoomStatus = "loading" | "ready" | "not-found" | "error" | "not-configured";

export type Room = {
  status: RoomStatus;
  me: string | null;
  hostId: string | null;
  isHost: boolean;
  joined: boolean;
  players: RoomPlayer[];
  settings: PartySettings;
  state: PartyState;
  answers: RoundAnswers;
  votes: RoundVotes;
  myAnswers: Record<string, string>;
  /** Relógio do servidor (ms). */
  serverNow: () => number;
  join: (profile: Profile) => Promise<void>;
  setAnswer: (categoryId: string, text: string) => void;
  stop: () => void;
  vote: (playerId: string, categoryId: string, accept: boolean | null) => void;
  updateSettings: (settings: PartySettings) => void;
  start: () => void;
  closeReview: () => void;
  next: () => void;
  backToLobby: () => void;
};

const TICK_MS = 250;
const ANSWER_DEBOUNCE_MS = 350;
const HOST_TAKEOVER_MS = 5000;

/** Sala do modo amigos: escuta o Firebase e, no aparelho do anfitrião, roda o relógio. */
export function useRoom(code: string): Room {
  const [status, setStatus] = useState<RoomStatus>(
    firebaseConfigured ? "loading" : "not-configured",
  );
  const [me, setMe] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [settings, setSettings] = useState<PartySettings>(DEFAULT_PARTY_SETTINGS);
  const [state, setState] = useState<PartyState>(createPartyState(DEFAULT_PARTY_SETTINGS));
  const [answers, setAnswers] = useState<RoundAnswers>({});
  const [votes, setVotes] = useState<RoundVotes>({});
  const [stopBy, setStopBy] = useState<string | null>(null);
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});

  const handles = useRef<{ db: Database; fb: Db; uid: string } | null>(null);
  const offset = useRef(0);
  const serverNow = useCallback(() => Date.now() + offset.current, []);

  // Refs para o laço do anfitrião (não reinicia a cada mudança).
  const live = useRef({ settings, state, answers, votes, players, stopBy });
  live.current = { settings, state, answers, votes, players, stopBy };
  const pendingAnswers = useRef<Record<string, string>>({});
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerRound = useRef(0);

  const base = `rooms/${code}`;

  // Conexão, presença e assinaturas da sala.
  useEffect(() => {
    if (!firebaseConfigured) return;
    let cancelled = false;
    const offs: (() => void)[] = [];
    (async () => {
      const [{ db, uid }, fb] = await Promise.all([getFirebase(), import("firebase/database")]);
      if (cancelled) return;
      handles.current = { db, fb, uid };
      setMe(uid);
      const meta = await fb.get(fb.ref(db, `${base}/meta`));
      if (cancelled) return;
      if (!meta.exists()) {
        setStatus("not-found");
        return;
      }
      const on = (path: string, handler: (value: unknown) => void) =>
        offs.push(fb.onValue(fb.ref(db, `${base}/${path}`), (snap) => handler(snap.val())));
      on("meta/hostId", (value) => setHostId((value as string) ?? null));
      on("players", (value) =>
        setPlayers(normalizePlayers(value as Record<string, Omit<RoomPlayer, "id">> | null)),
      );
      on("settings", (value) => setSettings(sanitizePartySettings(value as PartySettings | null)));
      on("state", (value) =>
        setState((previous) =>
          normalizeState(value as Partial<PartyState> | null, {
            ...DEFAULT_PARTY_SETTINGS,
            categories: previous.categories,
          }),
        ),
      );
      offs.push(
        fb.onValue(fb.ref(db, ".info/serverTimeOffset"), (snap) => {
          offset.current = Number(snap.val()) || 0;
        }),
      );
      // Presença: online enquanto a aba estiver aberta.
      offs.push(
        fb.onValue(fb.ref(db, ".info/connected"), async (snap) => {
          if (!snap.val()) return;
          const playerRef = fb.ref(db, `${base}/players/${uid}`);
          const current = await fb.get(playerRef);
          if (!current.exists()) return;
          await fb.onDisconnect(fb.ref(db, `${base}/players/${uid}/online`)).set(false);
          await fb.set(fb.ref(db, `${base}/players/${uid}/online`), true);
        }),
      );
      setStatus("ready");
    })().catch((error) => {
      console.error("[stopix] sala", error);
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      for (const off of offs) off();
    };
  }, [base]);

  // Respostas, votos e pedido de STOP da rodada atual.
  const round = state.round;
  useEffect(() => {
    const current = handles.current;
    if (!current || status !== "ready" || round < 1) return;
    const { db, fb } = current;
    setAnswers({});
    setVotes({});
    setStopBy(null);
    const offs = [
      fb.onValue(fb.ref(db, `${base}/answers/${round}`), (snap) =>
        setAnswers((snap.val() as RoundAnswers) ?? {}),
      ),
      fb.onValue(fb.ref(db, `${base}/votes/${round}`), (snap) =>
        setVotes((snap.val() as RoundVotes) ?? {}),
      ),
      fb.onValue(fb.ref(db, `${base}/stop/${round}`), (snap) =>
        setStopBy((snap.val() as string) ?? null),
      ),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [base, round, status]);

  // Rodada nova: folha em branco.
  useEffect(() => {
    if (answerRound.current === round) return;
    answerRound.current = round;
    pendingAnswers.current = {};
    setMyAnswers({});
  }, [round]);

  // Recarregou no meio da rodada: recupera o que já tinha mandado.
  useEffect(() => {
    if (!me || Object.keys(pendingAnswers.current).length) return;
    const saved = answers[me];
    if (state.phase === "playing" && saved && answerRound.current === round) {
      pendingAnswers.current = saved;
      setMyAnswers(saved);
    }
  }, [answers, me, state.phase, round]);

  const flushAnswers = useCallback(() => {
    const current = handles.current;
    if (answerTimer.current) clearTimeout(answerTimer.current);
    answerTimer.current = null;
    if (!current || answerRound.current < 1) return;
    const { db, fb, uid } = current;
    void fb
      .set(fb.ref(db, `${base}/answers/${answerRound.current}/${uid}`), pendingAnswers.current)
      .catch(() => {
        // Fora do tempo: o servidor recusa, e tudo bem.
      });
  }, [base]);

  // No STOP, manda o que estiver digitado na hora.
  useEffect(() => {
    if (state.phase === "stopping") flushAnswers();
  }, [state.phase, flushAnswers]);

  const setAnswer = useCallback(
    (categoryId: string, text: string) => {
      const value = text.slice(0, 40);
      pendingAnswers.current = { ...pendingAnswers.current, [categoryId]: value };
      setMyAnswers(pendingAnswers.current);
      if (answerTimer.current) clearTimeout(answerTimer.current);
      answerTimer.current = setTimeout(flushAnswers, ANSWER_DEBOUNCE_MS);
    },
    [flushAnswers],
  );

  const isHost = Boolean(me && me === hostId);

  const writeState = useCallback(
    (next: PartyState) => {
      const current = handles.current;
      if (!current || next === live.current.state) return;
      live.current.state = next;
      setState(next);
      void current.fb.set(current.fb.ref(current.db, `${base}/state`), toDb(next));
    },
    [base],
  );

  const reviewInput = useCallback(() => {
    const { answers: roundAnswers, votes: roundVotes, players: roomPlayers } = live.current;
    const ids = new Set(roomPlayers.filter((player) => player.online).map((player) => player.id));
    for (const id of Object.keys(roundAnswers)) ids.add(id);
    return { answers: roundAnswers, votes: roundVotes, playerIds: [...ids] };
  }, []);

  // Laço do anfitrião: relógio das fases e pedidos de STOP.
  useEffect(() => {
    if (!isHost || status !== "ready") return;
    const timer = setInterval(() => {
      const { state: current, settings: roomSettings, stopBy: stopper } = live.current;
      const now = serverNow();
      let next = current;
      if (stopper && current.phase === "playing") next = requestStop(current, stopper, now);
      next = partyTick(next, roomSettings, now, Math.random, reviewInput());
      writeState(next);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isHost, status, serverNow, writeState, reviewInput]);

  // Anfitrião saiu: o jogador mais antigo que está online assume.
  const host = players.find((player) => player.id === hostId);
  const successor = players.find((player) => player.online);
  const hostGone = Boolean(host && !host.online && successor?.id === me);
  useEffect(() => {
    const current = handles.current;
    if (!hostGone || !current) return;
    const timer = setTimeout(() => {
      void current.fb.update(current.fb.ref(current.db, `${base}/meta`), {
        hostId: current.uid,
      });
    }, HOST_TAKEOVER_MS);
    return () => clearTimeout(timer);
  }, [hostGone, base]);

  const join = useCallback(
    async (profile: Profile) => {
      const current = handles.current;
      if (!current) return;
      const { db, fb, uid } = current;
      const playerRef = fb.ref(db, `${base}/players/${uid}`);
      const existing = await fb.get(playerRef);
      await fb.set(playerRef, {
        ...profile,
        joinedAt: existing.exists() ? existing.val().joinedAt : fb.serverTimestamp(),
        online: true,
      });
      await fb.onDisconnect(fb.ref(db, `${base}/players/${uid}/online`)).set(false);
    },
    [base],
  );

  const stop = useCallback(() => {
    const current = handles.current;
    if (!current || live.current.state.phase !== "playing") return;
    flushAnswers();
    const { db, fb, uid } = current;
    void fb.set(fb.ref(db, `${base}/stop/${live.current.state.round}`), uid).catch(() => {
      // Alguém pediu primeiro.
    });
  }, [base, flushAnswers]);

  const vote = useCallback(
    (playerId: string, categoryId: string, accept: boolean | null) => {
      const current = handles.current;
      if (!current) return;
      const { db, fb, uid } = current;
      const path = `${base}/votes/${live.current.state.round}/${voteKey(playerId, categoryId)}/${uid}`;
      void (accept === null ? fb.remove(fb.ref(db, path)) : fb.set(fb.ref(db, path), accept));
    },
    [base],
  );

  const updateSettings = useCallback(
    (next: PartySettings) => {
      const current = handles.current;
      if (!current) return;
      const clean = sanitizePartySettings(next);
      setSettings(clean);
      saveLastSettings(clean);
      void current.fb.set(current.fb.ref(current.db, `${base}/settings`), clean);
      if (live.current.state.phase === "lobby") {
        writeState({
          ...live.current.state,
          categories: clean.categories,
          totalRounds: clean.rounds,
        });
      }
    },
    [base, writeState],
  );

  const start = useCallback(
    () => writeState(startParty(live.current.settings, serverNow(), Math.random)),
    [serverNow, writeState],
  );
  const closeReview = useCallback(
    () => writeState(finishReview(live.current.state, serverNow(), reviewInput())),
    [serverNow, writeState, reviewInput],
  );
  const next = useCallback(
    () =>
      writeState(
        nextPartyRound(live.current.state, live.current.settings, serverNow(), Math.random),
      ),
    [serverNow, writeState],
  );
  const backToLobby = useCallback(
    () => writeState(createPartyState(live.current.settings)),
    [writeState],
  );

  const joined = useMemo(() => players.some((player) => player.id === me), [players, me]);

  return {
    status,
    me,
    hostId,
    isHost,
    joined,
    players,
    settings,
    state,
    answers,
    votes,
    myAnswers,
    serverNow,
    join,
    setAnswer,
    stop,
    vote,
    updateSettings,
    start,
    closeReview,
    next,
    backToLobby,
  };
}
