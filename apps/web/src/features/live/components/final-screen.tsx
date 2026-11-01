"use client";

import type { ScoreEntry } from "@stopix/game-core";
import { motion } from "motion/react";
import { Avatar } from "./avatar";
import { Confetti } from "./confetti";

const BLOCK = [
  { height: 120, color: "#ffd23f", label: "1º" },
  { height: 88, color: "#d7dbe8", label: "2º" },
  { height: 64, color: "#e59a5b", label: "3º" },
];

/** Fim da partida: campeão no pódio e contagem para a próxima. */
export function FinalScreen({ ranking, seconds }: { ranking: ScoreEntry[]; seconds: number }) {
  const [first] = ranking;
  const order = [1, 0, 2];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="stage-bg absolute inset-0 z-20 flex flex-col items-center pt-[110px]"
    >
      {first ? <Confetti count={110} /> : null}
      <span className="game-text text-[30px] text-white">Fim de partida!</span>
      <span className="game-text mt-1 text-[44px] text-sun">🏆 Campeão 🏆</span>
      {first ? (
        <>
          <div className="relative mt-3 flex size-[230px] items-center justify-center">
            <div className="sunburst absolute inset-0 rounded-full" />
            <div className="relative rounded-full bg-sun p-[5px]">
              <span className="absolute -top-[34px] left-1/2 -translate-x-1/2 text-[44px]">👑</span>
              <Avatar player={first.player} size={128} className="border-4 border-ink" />
            </div>
          </div>
          <span className="game-text -mt-2 max-w-[480px] truncate text-[36px] text-white normal-case">
            {first.player.name}
          </span>
          <span className="pill-green mt-1 rounded-full px-5 py-1 font-[family-name:var(--font-display)] text-[24px] text-white">
            {first.points} PONTOS
          </span>
          <div className="mt-6 flex items-end gap-2">
            {order.map((index) => {
              const entry = ranking[index];
              const block = BLOCK[index];
              return (
                <motion.div
                  key={index}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                  className="flex w-[140px] flex-col items-center"
                >
                  {entry ? (
                    <>
                      <Avatar player={entry.player} size={44} className="border-2 border-white" />
                      <span className="mt-1 max-w-[130px] truncate text-[13px] font-black">
                        {entry.player.name}
                      </span>
                      <span className="text-[12px] font-black text-sun">{entry.points} pts</span>
                    </>
                  ) : null}
                  <div
                    className="mt-1 flex w-full items-start justify-center rounded-t-xl border-[3px] border-ink pt-1"
                    style={{ height: block.height, background: block.color }}
                  >
                    <span className="font-[family-name:var(--font-display)] text-[28px] text-ink">
                      {block.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <span className="mt-8 text-[18px] font-black text-white/85">
          Ninguém pontuou nesta partida.
        </span>
      )}
      <span className="mt-6 text-[17px] font-black text-white/90">Nova partida em {seconds}s</span>
    </motion.div>
  );
}
