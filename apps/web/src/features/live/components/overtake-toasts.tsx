"use client";

import type { Overtake } from "@stopix/game-core";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "./avatar";

export type OvertakeToast = Overtake & { id: number };

/** "🔥 fulano passou beltrano! 2º lugar" logo acima do ranking. */
export function OvertakeToasts({ toast }: { toast: OvertakeToast | null }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
      style={{ top: 664 }}
    >
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="flex max-w-[500px] items-center gap-1.5 rounded-full border-2 border-sun bg-ink/95 py-1 pr-3.5 pl-1 text-[14px] font-extrabold text-white shadow-[0_0_16px_rgb(255_210_63_/_0.6)]"
          >
            <Avatar player={toast.player} size={26} />
            <span>🔥</span>
            <span className="truncate">
              <b className="text-sun">{toast.player.name}</b> passou <b>{toast.passed.name}</b>!{" "}
              {toast.position}º lugar
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
