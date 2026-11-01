"use client";

import type { ScoreEntry } from "@stopix/game-core";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const RING = ["#2dd4bf", "#60a5fa", "#a78bfa"];

function Place({ entry, place }: { entry?: ScoreEntry; place: 0 | 1 | 2 }) {
  const big = place === 0;
  const size = big ? 66 : 52;
  return (
    <div className={cn("flex w-[150px] flex-col items-center", big ? "mt-0" : "mt-4")}>
      <div className="relative">
        {entry ? (
          <motion.div
            key={entry.player.id}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            className="rounded-full border-[3px] border-[#120a3a] p-[3px]"
            style={{ background: RING[place], boxShadow: big ? `0 0 18px ${RING[0]}` : undefined }}
          >
            <Avatar player={entry.player} size={size} />
          </motion.div>
        ) : (
          <div
            className="rounded-full border-[3px] border-dashed border-white/30"
            style={{ width: size + 12, height: size + 12 }}
          />
        )}
        <span
          className="absolute -right-1 -bottom-1 flex size-[24px] items-center justify-center rounded-full border-[2.5px] border-[#120a3a] text-[13px] font-black text-[#120a3a]"
          style={{ background: RING[place] }}
        >
          {place + 1}
        </span>
      </div>
      <p className="mt-1 max-w-[140px] truncate text-[13px] font-black text-white">
        {entry?.player.name ?? "—"}
      </p>
      <span className="mt-0.5 rounded-full border-2 border-[#120a3a] bg-white px-2.5 text-[14px] font-black text-[#120a3a]">
        {entry?.points ?? 0}
      </span>
    </div>
  );
}

/** Placar da partida: pódio com os 3 primeiros, 4º e 5º embaixo. */
export function Podium({ ranking }: { ranking: ScoreEntry[] }) {
  return (
    <div className="chunky relative mx-3 rounded-[24px] px-2 pt-8 pb-2.5">
      <div className="chunky-pill absolute -top-[17px] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-0.5">
        <Trophy className="size-4 text-[#120a3a]" strokeWidth={3} />
        <span className="game-text-sm text-[16px] text-white">Ranking</span>
      </div>
      <div className="flex items-start justify-center">
        <Place entry={ranking[1]} place={1} />
        <Place entry={ranking[0]} place={0} />
        <Place entry={ranking[2]} place={2} />
      </div>
      <div className="mt-2 flex justify-center gap-5 text-[12px] font-extrabold text-white/90">
        {[3, 4].map((index) =>
          ranking[index] ? (
            <span key={index} className="flex items-center gap-1.5">
              <span className="text-white/60">{index + 1}º</span>
              <Avatar player={ranking[index].player} size={20} />
              <span className="max-w-[110px] truncate">{ranking[index].player.name}</span>
              <span className="text-aqua-light">{ranking[index].points}</span>
            </span>
          ) : null,
        )}
        {ranking.length === 0 ? (
          <span className="text-white/75">A primeira resposta certa vale +150!</span>
        ) : null}
      </div>
    </div>
  );
}
