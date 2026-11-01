"use client";

import type { ScoreEntry } from "@stopix/game-core";
import { motion } from "motion/react";
import { WaveText } from "@/components/motion/wave-text";
import { Confetti } from "./confetti";
import { Leaderboard } from "./leaderboard";
import { HaloAvatar } from "./results-screen";

/** Fim da partida: campeão em destaque, placar final e contagem para a próxima. */
export function FinalScreen({ ranking, seconds }: { ranking: ScoreEntry[]; seconds: number }) {
  const [first] = ranking;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="stage-bg absolute inset-0 z-20 flex flex-col items-center justify-center"
    >
      {first ? <Confetti count={110} /> : null}
      <span className="text-[13px] font-extrabold tracking-[0.3em] text-aqua-light uppercase">
        Fim de partida
      </span>
      <motion.span
        initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
        className="mt-1"
      >
        <WaveText
          text="CAMPEÃO"
          className="game-text text-[56px] leading-none text-aqua-light italic"
          amplitude={8}
        />
      </motion.span>
      {first ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="mt-5 flex flex-col items-center"
        >
          <HaloAvatar player={first.player} size={136} />
          <span className="mt-3 max-w-[480px] truncate text-[34px] font-black tracking-tight">
            {first.player.name}
          </span>
          <span className="text-[18px] font-bold text-aqua-light">{first.points} pontos</span>
        </motion.div>
      ) : (
        <span className="mt-6 text-[17px] font-medium text-white/75">
          Ninguém pontuou nesta partida.
        </span>
      )}
      <div className="mt-6 w-full">
        <Leaderboard ranking={ranking} title="Placar final" />
      </div>
      <span className="mt-5 text-[16px] font-bold text-white/80">
        Nova partida em <span className="text-aqua-light">{seconds}s</span>
      </span>
    </motion.div>
  );
}
