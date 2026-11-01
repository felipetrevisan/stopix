"use client";

import type { RoundSummary } from "@stopix/game-core";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Avatar } from "./avatar";
import { Confetti } from "./confetti";

function AlsoValid({ words }: { words: string[] }) {
  if (!words.length) return null;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="mt-7 flex flex-col items-center gap-2"
    >
      <span className="rounded-full border-2 border-ink bg-sun px-3 py-0.5 font-[family-name:var(--font-display)] text-[14px] text-ink">
        TAMBÉM VALIA
      </span>
      <div className="flex max-w-[480px] flex-wrap justify-center gap-1.5">
        {words.map((word) => (
          <span
            key={word}
            className="rounded-lg border-2 border-ink bg-white px-2.5 py-0.5 font-[family-name:var(--font-display)] text-[17px] text-ink capitalize"
          >
            {word}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/** Vencedor da rodada: foto grande com raios, pontos, 2º e 3º e o que também valia. */
export function ResultsScreen({ summary }: { summary: RoundSummary }) {
  const [winner, ...others] = summary.podium;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="stage-bg absolute inset-0 z-20 flex flex-col items-center pt-[120px]"
    >
      {winner ? <Confetti /> : null}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <Trophy className="size-9 fill-sun text-[#b86e00]" />
        <span className="game-text text-[38px] text-sun">
          {winner ? "Vencedor da rodada" : "Ninguém acertou!"}
        </span>
      </motion.div>

      {winner ? (
        <>
          <div className="relative mt-4 flex size-[250px] items-center justify-center">
            <div className="sunburst absolute inset-0 rounded-full" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.15 }}
              className="relative rounded-full bg-sun p-[5px] shadow-[0_0_30px_rgb(255_210_63_/_0.8)]"
            >
              <span className="absolute -top-[34px] left-1/2 -translate-x-1/2 text-[44px]">👑</span>
              <Avatar player={winner.player} size={136} className="border-4 border-ink" />
            </motion.div>
          </div>
          <span className="game-text -mt-3 max-w-[480px] truncate text-[38px] text-white normal-case">
            {winner.player.name}
          </span>
          <span className="mt-0.5 text-[15px] font-black text-white/90 uppercase">
            “{winner.word}”
          </span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.45 }}
            className="pill-green mt-2 rounded-full px-5 py-1 font-[family-name:var(--font-display)] text-[26px] text-white"
          >
            +{winner.points} PONTOS
          </motion.span>
          <div className="mt-4 flex gap-2.5">
            {others.map((place, index) => (
              <motion.span
                key={place.player.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.12 }}
                className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-0.5 pr-2.5 pl-1 text-[13px] font-black text-ink"
              >
                <span className="pl-1">{index + 2}º</span>
                <Avatar player={place.player} size={24} />
                <span className="max-w-[110px] truncate">{place.player.name}</span>
                <span className="text-[#22a845]">+{place.points}</span>
              </motion.span>
            ))}
          </div>
        </>
      ) : (
        <span className="mt-10 text-[110px]">😅</span>
      )}
      <AlsoValid words={summary.alsoValid} />
    </motion.div>
  );
}
