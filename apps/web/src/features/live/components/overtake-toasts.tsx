"use client";

import type { GiftEffect, Overtake, Player } from "@stopix/game-core";
import { TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "./avatar";
import { GiftIcon } from "./gift-legend";

export type FeedToast =
  | (Overtake & { id: number; kind: "overtake" })
  | {
      id: number;
      kind: "gift";
      player: Player;
      effect: GiftEffect;
      image?: string;
      count: number;
      label: string;
      queued: boolean;
    };

/** Avisos acima do ranking: ultrapassagem e presente que mexeu no jogo. */
export function FeedToasts({ toast, top }: { toast: FeedToast | null; top: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
      style={{ top }}
    >
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ y: 24, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="flex max-w-[510px] items-center gap-2 rounded-full border-[3px] border-[#120a3a] bg-white py-1 pr-3.5 pl-1 text-[14px] font-bold text-[#120a3a] shadow-[0_4px_0_#120a3a]"
          >
            <Avatar player={toast.player} size={30} />
            {toast.kind === "overtake" ? (
              <>
                <TrendingUp className="size-4 shrink-0 text-blue" strokeWidth={3} />
                <span className="truncate">
                  <b className="font-black">{toast.player.name}</b> passou{" "}
                  <b className="font-black">{toast.passed.name}</b>!
                </span>
                <span className="rounded-lg bg-[#120a3a] px-1.5 font-black text-aqua-light">
                  {toast.position}º
                </span>
              </>
            ) : (
              <>
                <GiftIcon effect={toast.effect} image={toast.image} size={30} />
                <span className="truncate">
                  <b className="font-black">{toast.player.name}</b>
                  {toast.count > 1 ? ` ×${toast.count}` : ""}:{" "}
                  <b className="font-black text-purple">{toast.label}</b>
                  {toast.queued ? " na próxima rodada" : "!"}
                </span>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
