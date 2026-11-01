"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const COLORS = ["#ffd23f", "#34c759", "#ff5d8f", "#3a86ff", "#ffffff", "#ff9f1c", "#b388ff"];

/** Chuva de confete que explode do centro e cai. */
export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        x: (Math.random() - 0.5) * 520,
        y: -120 - Math.random() * 260,
        fall: 380 + Math.random() * 420,
        rotate: (Math.random() - 0.5) * 900,
        color: COLORS[index % COLORS.length],
        width: 6 + Math.random() * 6,
        delay: Math.random() * 0.25,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute top-[42%] left-1/2 z-30">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute block rounded-[2px]"
          style={{ width: piece.width, height: piece.width * 0.45, background: piece.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: [0, piece.x, piece.x * 1.1],
            y: [0, piece.y, piece.y + piece.fall],
            rotate: piece.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 2.6, delay: piece.delay, ease: "easeOut", times: [0, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
