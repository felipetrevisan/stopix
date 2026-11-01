"use client";

import type { ScoreEntry } from "@stopix/game-core";
import { BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

/** Placar da partida: os 5 primeiros com barra proporcional aos pontos. */
export function Leaderboard({
  ranking,
  rows = 5,
  title = "Placar da partida",
}: {
  ranking: ScoreEntry[];
  rows?: number;
  title?: string;
}) {
  const top = ranking.slice(0, rows);
  const max = Math.max(1, top[0]?.points ?? 1);
  return (
    <div className="glass mx-4 rounded-[26px] px-3 pt-3 pb-2.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[12px] font-extrabold tracking-[0.16em] text-white/80 uppercase">
          <BarChart3 className="size-4 text-purple" strokeWidth={3} /> {title}
        </span>
        {ranking.length > rows ? (
          <span className="text-[11px] font-bold text-white/50">{ranking.length} jogadores</span>
        ) : null}
      </div>
      {top.length ? (
        <ol className="flex flex-col gap-1">
          {top.map((entry, index) => (
            <motion.li
              key={entry.player.id}
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative flex h-[34px] items-center gap-2.5 overflow-hidden rounded-xl px-2"
            >
              <motion.span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-xl",
                  index === 0 ? "grad-brand opacity-45" : "bg-white/[0.08]",
                )}
                initial={false}
                animate={{ width: `${Math.max(8, (entry.points / max) * 100)}%` }}
              />
              <span
                className={cn(
                  "relative w-5 text-center text-[16px] font-black",
                  index === 0 ? "text-aqua-light" : "text-white/60",
                )}
              >
                {index + 1}
              </span>
              <Avatar player={entry.player} size={24} className="relative" />
              <span className="relative min-w-0 flex-1 truncate text-[14px] font-bold text-white">
                {entry.player.name}
              </span>
              <span className="relative text-[15px] font-black text-white tabular-nums">
                {entry.points}
              </span>
            </motion.li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-center text-[14px] font-medium text-white/65">
          Ninguém pontuou ainda. A primeira resposta certa vale{" "}
          <b className="text-aqua-light">+150</b>.
        </p>
      )}
    </div>
  );
}
