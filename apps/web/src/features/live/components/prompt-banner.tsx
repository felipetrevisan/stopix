"use client";

import type { Phase } from "@stopix/game-core";
import { motion } from "motion/react";

/** Faixa abaixo da letra: o pedido da rodada ou o que está acontecendo. */
export function PromptBanner({
  phase,
  ask,
  letter,
}: {
  phase: Phase;
  ask: string;
  letter: string;
}) {
  if (phase === "drawing") {
    return (
      <motion.div
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
        className="stage-panel mx-auto w-fit rounded-2xl px-6 py-2.5"
      >
        <span className="game-text-sm text-[22px] text-sun">Sorteando a letra…</span>
      </motion.div>
    );
  }
  if (phase === "intermission" || phase === "final") {
    return (
      <div className="stage-panel mx-auto w-fit rounded-2xl px-6 py-2.5">
        <span className="game-text-sm text-[21px] text-white">A próxima rodada já vai começar</span>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="stage-panel mx-auto w-[508px] rounded-2xl px-4 py-2 text-center"
    >
      <span className="game-text-sm text-[21px] leading-[1.25] text-white">
        Manda no chat {ask} com a letra{" "}
        <span className="letter-tile-sm relative -top-0.5 inline-flex size-[28px] items-center justify-center rounded-lg align-middle font-[family-name:var(--font-display)] text-[21px] text-[#3a1a00] [-webkit-text-stroke:0] [text-shadow:none]">
          {letter}
        </span>
      </span>
    </motion.div>
  );
}
