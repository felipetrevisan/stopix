"use client";

import type { ScoreEntry } from "@stopix/game-core";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const RING = ["#ffd23f", "#d7dbe8", "#e59a5b"];

function Podium({ entry, place }: { entry?: ScoreEntry; place: 0 | 1 | 2 }) {
  const big = place === 0;
  const size = big ? 66 : 52;
  return (
    <div className={cn("flex w-[150px] flex-col items-center", big ? "mt-1" : "mt-4")}>
      <div className="relative">
        {big ? (
          <span className="absolute -top-[17px] left-1/2 -translate-x-1/2 text-[22px] drop-shadow">
            👑
          </span>
        ) : null}
        {entry ? (
          <motion.div
            key={entry.player.id}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="rounded-full p-[3px]"
            style={{ background: RING[place] }}
          >
            <Avatar player={entry.player} size={size} />
          </motion.div>
        ) : (
          <div
            className="rounded-full border-[3px] border-dashed border-white/30"
            style={{ width: size + 6, height: size + 6 }}
          />
        )}
        <span
          className="absolute -right-1 -bottom-1 flex size-[22px] items-center justify-center rounded-full border-2 border-ink font-[family-name:var(--font-display)] text-[12px] text-ink"
          style={{ background: RING[place] }}
        >
          {place + 1}
        </span>
      </div>
      <p className="mt-1 max-w-[140px] truncate text-[13px] font-black italic text-white">
        {entry?.player.name ?? "—"}
      </p>
      <span className="pill-green mt-0.5 rounded-full px-2.5 font-[family-name:var(--font-display)] text-[14px] text-white">
        {entry?.points ?? 0}
      </span>
    </div>
  );
}

/** Placar da partida: pódio com os 3 primeiros e 4º e 5º embaixo. */
export function RankingBoard({ ranking }: { ranking: ScoreEntry[] }) {
  return (
    <div className="stage-panel relative mx-3 rounded-[22px] px-2 pt-8 pb-2">
      <div className="absolute -top-[15px] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border-2 border-ink bg-sun px-3 py-0.5">
        <Trophy className="size-4 text-ink" strokeWidth={3} />
        <span className="font-[family-name:var(--font-display)] text-[16px] text-ink">RANKING</span>
      </div>
      <div className="flex items-start justify-center">
        <Podium entry={ranking[1]} place={1} />
        <Podium entry={ranking[0]} place={0} />
        <Podium entry={ranking[2]} place={2} />
      </div>
      <div className="mt-1.5 flex justify-center gap-5 text-[12px] font-extrabold text-white/90">
        {[3, 4].map((index) =>
          ranking[index] ? (
            <span key={index} className="flex items-center gap-1.5">
              <span className="text-white/70">{index + 1}º</span>
              <Avatar player={ranking[index].player} size={20} />
              <span className="max-w-[110px] truncate">{ranking[index].player.name}</span>
              <span className="text-sun">{ranking[index].points}</span>
            </span>
          ) : null,
        )}
        {ranking.length === 0 ? (
          <span className="text-white/75">O primeiro a acertar ganha +150!</span>
        ) : null}
      </div>
    </div>
  );
}
