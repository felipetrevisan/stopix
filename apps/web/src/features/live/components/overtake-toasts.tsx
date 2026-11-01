"use client";

import type { Overtake } from "@stopix/game-core";
import { TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "./avatar";

export type OvertakeToast = Overtake & { id: number };

/** Aviso de ultrapassagem que entra pela direita, logo acima do placar. */
export function OvertakeToasts({ toast, top }: { toast: OvertakeToast | null; top: number }) {
  return (
    <div className="pointer-events-none absolute right-4 z-10" style={{ top }}>
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="grad-brand flex max-w-[440px] items-center gap-2 rounded-2xl py-1.5 pr-3 pl-1.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgb(59_130_246_/_0.5)]"
          >
            <Avatar player={toast.player} size={28} className="ring-2 ring-white/60" />
            <TrendingUp className="size-4 shrink-0" strokeWidth={3} />
            <span className="truncate">
              <b>{toast.player.name}</b> passou <b>{toast.passed.name}</b>
            </span>
            <span className="rounded-lg bg-white/25 px-1.5 font-black">{toast.position}º</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
