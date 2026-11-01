"use client";

import type { GiftEffect } from "@stopix/game-core";
import { AnimatePresence, motion } from "motion/react";

export type Burst = { id: number; effect: GiftEffect; text: string };

const COLOR: Record<GiftEffect, string> = {
  time: "#5eead4",
  freeze: "#bae6fd",
  letter: "#ffffff",
  category: "#ffffff",
  double: "#c4b5fd",
};

/** Texto grande que pula em cima da letra quando um presente faz efeito. */
export function EffectBurst({ burst }: { burst: Burst | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <AnimatePresence>
        {burst ? (
          <motion.span
            key={burst.id}
            initial={{ scale: 0.3, opacity: 0, y: 20 }}
            animate={{ scale: [0.3, 1.25, 1], opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ duration: 0.45 }}
            className="game-text text-[44px] whitespace-nowrap"
            style={{ color: COLOR[burst.effect] }}
          >
            {burst.text}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
