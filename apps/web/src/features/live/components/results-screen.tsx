"use client";

import type { RoundSummary } from "@stopix/game-core";
import { motion } from "motion/react";
import { Avatar } from "./avatar";
import { Confetti } from "./confetti";

/** Foto com anel em degradê girando. */
export function HaloAvatar({
  player,
  size,
}: {
  player: RoundSummary["podium"][number]["player"];
  size: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 16, height: size + 16 }}
    >
      <span className="ring-spin absolute inset-0 rounded-full" />
      <span className="absolute inset-[4px] rounded-full bg-deep" />
      <Avatar player={player} size={size} className="relative" />
    </div>
  );
}

/** Vencedor da rodada: cartão com a foto, a palavra, os pontos, 2º e 3º e o que também valia. */
export function ResultsScreen({ summary, round }: { summary: RoundSummary; round: number }) {
  const [winner, ...others] = summary.podium;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="stage-bg absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
    >
      {winner ? <Confetti /> : null}
      <span className="text-[13px] font-extrabold tracking-[0.3em] text-aqua-light uppercase">
        Rodada {round}
      </span>
      <span className="mt-1 text-[40px] leading-none font-black tracking-tight text-white">
        {winner ? "Quem levou" : "Ninguém acertou"}
      </span>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="glass mt-6 flex w-full flex-col items-center rounded-[32px] px-6 pt-7 pb-6"
      >
        {winner ? (
          <>
            <HaloAvatar player={winner.player} size={128} />
            <span className="mt-3 max-w-full truncate text-[32px] font-black tracking-tight text-white">
              {winner.player.name}
            </span>
            <span className="mt-1 rounded-full bg-white/10 px-3 py-0.5 text-[16px] font-bold text-white/90 capitalize">
              {winner.word}
            </span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.35 }}
              className="grad-text mt-2 text-[64px] leading-none font-black italic"
            >
              +{winner.points}
            </motion.span>
            {others.length ? (
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                {others.map((place, index) => (
                  <div
                    key={place.player.id}
                    className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-2.5 py-2"
                  >
                    <span className="text-[15px] font-black text-white/60">{index + 2}º</span>
                    <Avatar player={place.player} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                      {place.player.name}
                    </span>
                    <span className="text-[13px] font-black text-aqua-light">+{place.points}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <span className="py-6 text-[16px] font-medium text-white/75">
            Ninguém mandou uma resposta certa a tempo.
          </span>
        )}
      </motion.div>

      {summary.alsoValid.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex flex-col items-center gap-2"
        >
          <span className="text-[12px] font-extrabold tracking-[0.2em] text-white/60 uppercase">
            Também valia
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {summary.alsoValid.map((word) => (
              <span
                key={word}
                className="rounded-full border border-aqua/50 px-3 py-1 text-[15px] font-bold text-aqua-light capitalize"
              >
                {word}
              </span>
            ))}
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
