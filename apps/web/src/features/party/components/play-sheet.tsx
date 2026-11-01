"use client";

import { WaveText } from "@/components/motion/wave-text";
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
      <WaveText
        text="Sorteando a letra…"
        className="game-text-sm text-[22px] text-white"
        amplitude={5}
      />
    </div>
  );
}

function StopOverlay({ by }: { by: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#120a3a]/75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="chunky-pill flex size-[150px] items-center justify-center rounded-full"
      >
        <Hand className="size-[76px]" strokeWidth={2.2} />
      </motion.div>
      <span className="mt-3 leading-none">
        <WaveText
          text="STOP!"
          className="game-text text-[84px] text-aqua-light italic"
          amplitude={10}
        />
      </span>
      <span className="game-text-sm mt-3 text-[20px] text-white">
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
      <div className="chunky chunky-see-through sticky top-2 z-20 flex items-center gap-3 rounded-[24px] p-3">
        <span className="animate-bob">
          <LetterTile letter={state.letter} size={60} />
        </span>
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
                className="flex shrink-0 items-center gap-1 rounded-full border-2 border-[#120a3a] bg-white py-0.5 pr-2.5 pl-0.5 text-[12px] font-black text-[#120a3a]"
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
            <motion.li
              key={id}
              initial={{ x: index % 2 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 22,
                delay: 0.1 + index * 0.06,
              }}
            >
              <label className="chunky chunky-see-through flex items-center gap-3 rounded-[20px] px-3 py-2">
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
                    "h-11 min-w-0 flex-1 rounded-xl border-[3px] bg-white px-3 text-[18px] font-black text-[#120a3a] capitalize outline-none transition placeholder:text-[#120a3a]/30 focus-visible:ring-4 disabled:opacity-70",
                    wrong
                      ? "border-hot focus-visible:ring-hot/50"
                      : "border-[#120a3a] focus-visible:ring-aqua/60",
                  )}
                />
              </label>
              {wrong ? (
                <p className="mt-0.5 pl-3 text-[12px] font-bold text-hot">
                  Tem que começar com {state.letter}
                </p>
              ) : null}
            </motion.li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#120a3a]/80 via-[#120a3a]/35 to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={!complete || locked}
            onClick={room.stop}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl transition active:translate-y-[3px]",
              complete && !locked
                ? "chunky-pill glow-pulse game-text-sm text-[24px] text-white italic"
                : "border-[3px] border-[#120a3a] bg-[#120a3a]/70 text-[15px] font-bold text-white/70",
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
