"use client";

import { getCategory, initialOf } from "@stopix/game-core";
import { Hand } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { secondsLeft, useNow } from "@/features/live/components/use-now";
import { cn } from "@/lib/utils";
import type { Room } from "../use-room";
import { LetterTile, PlayerAvatar, TimerBar, playerName } from "./ui";

const ALPHABET = "ABCDEFGHIJLMNOPRSTUV";

function Drawing() {
  const [letter, setLetter] = useState("A");
  useEffect(() => {
    const timer = setInterval(
      () => setLetter(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]),
      90,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <LetterTile letter={letter} size={170} />
      <span className="animate-pulse text-[20px] font-extrabold text-white/85">
        Sorteando a letra…
      </span>
    </div>
  );
}

function StopOverlay({ by }: { by: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-night/75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="grad-brand flex size-[150px] items-center justify-center rounded-full shadow-[0_0_60px_rgb(59_130_246_/_0.7)]"
      >
        <Hand className="size-[76px]" strokeWidth={2.2} />
      </motion.div>
      <span className="grad-text mt-3 text-[80px] leading-none font-black tracking-tighter italic">
        STOP!
      </span>
      <span className="mt-3 text-[18px] font-bold text-white/85">
        {by ? `${by} pediu STOP` : "Acabou o tempo!"}
      </span>
    </motion.div>
  );
}

/** Folha da rodada: uma linha por categoria e o botão de STOP. */
export function PlaySheet({ room }: { room: Room }) {
  const { state, settings, myAnswers, players, answers, me } = room;
  useNow(250);
  const now = room.serverNow();
  const seconds = secondsLeft(state.endsAt, now);
  const fraction = (state.endsAt - now) / (settings.roundSec * 1000);
  const filled = state.categories.filter((id) => (myAnswers[id] ?? "").trim()).length;
  const complete = filled === state.categories.length;
  const locked = state.phase !== "playing";

  if (state.phase === "drawing") return <Drawing />;

  return (
    <div className="flex flex-col gap-3 pb-28">
      <div className="glass sticky top-2 z-20 flex items-center gap-3 rounded-3xl p-3">
        <LetterTile letter={state.letter} size={60} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-white/60">
            Rodada {state.round}/{state.totalRounds} · tudo com{" "}
            <b className="text-white">{state.letter}</b>
          </p>
          <TimerBar
            fraction={state.phase === "playing" ? fraction : 0}
            seconds={locked ? 0 : seconds}
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {players
          .filter((player) => player.online && player.id !== me)
          .map((player) => {
            const count = state.categories.filter((id) =>
              (answers[player.id]?.[id] ?? "").trim(),
            ).length;
            return (
              <span
                key={player.id}
                className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.07] py-1 pr-2.5 pl-1 text-[12px] font-bold"
              >
                <PlayerAvatar player={player} size={22} />
                {player.name}
                <span
                  className={cn(
                    count === state.categories.length ? "text-aqua-light" : "text-white/50",
                  )}
                >
                  {count}/{state.categories.length}
                </span>
              </span>
            );
          })}
      </div>

      <ul className="flex flex-col gap-2">
        {state.categories.map((id, index) => {
          const category = getCategory(id);
          const value = myAnswers[id] ?? "";
          const wrong = value.trim().length > 0 && initialOf(value) !== state.letter;
          return (
            <li key={id}>
              <label className="glass flex items-center gap-3 rounded-2xl px-3 py-2">
                <span className="w-[92px] shrink-0 leading-tight">
                  <span className="text-[18px]">{category?.emoji}</span>
                  <span className="block text-[12px] font-bold text-white/70">
                    {category?.name}
                  </span>
                </span>
                <input
                  value={value}
                  disabled={locked}
                  onChange={(event) => room.setAnswer(id, event.target.value)}
                  placeholder={`${state.letter}…`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint={index === state.categories.length - 1 ? "done" : "next"}
                  // biome-ignore lint/a11y/noAutofocus: primeira casa já pronta para digitar
                  autoFocus={index === 0}
                  className={cn(
                    "h-11 min-w-0 flex-1 rounded-xl border bg-night/50 px-3 text-[18px] font-bold capitalize outline-none transition focus-visible:ring-2",
                    wrong
                      ? "border-hot/70 focus-visible:ring-hot/40"
                      : "border-white/10 focus-visible:border-aqua focus-visible:ring-aqua/40",
                  )}
                />
              </label>
              {wrong ? (
                <p className="mt-0.5 pl-3 text-[12px] font-bold text-hot">
                  Tem que começar com {state.letter}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-night via-night/90 to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={!complete || locked}
            onClick={room.stop}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[20px] font-black italic transition active:scale-[0.98]",
              complete && !locked
                ? "grad-brand shadow-[0_0_30px_rgb(45_212_191_/_0.55)]"
                : "bg-white/10 text-[15px] font-bold text-white/55 not-italic",
            )}
          >
            {complete ? (
              <>
                <Hand className="size-6" /> STOP!
              </>
            ) : (
              `Preencha tudo para pedir STOP (${filled}/${state.categories.length})`
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {state.phase === "stopping" ? (
          <StopOverlay by={state.stoppedBy ? playerName(players, state.stoppedBy) : null} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
