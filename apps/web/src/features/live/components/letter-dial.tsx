"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJLMNOPRSTUV";
const SIZE = 196;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ringColor = (fraction: number) =>
  fraction > 0.5 ? "#34c759" : fraction > 0.25 ? "#ff9f1c" : "#e5262c";

/**
 * Letra da rodada dentro do anel do tempo. No sorteio, as letras giram até parar;
 * valendo, o anel esvazia (verde → laranja → vermelho) e o selo mostra os segundos.
 */
export function LetterDial({
  letter,
  spinning,
  fraction,
  seconds,
  onSpinTick,
}: {
  letter: string;
  spinning: boolean;
  /** Quanto do tempo ainda resta (0–1). */
  fraction: number;
  seconds: number;
  onSpinTick?: () => void;
}) {
  const [shown, setShown] = useState(letter);

  useEffect(() => {
    if (!spinning) {
      setShown(letter);
      return;
    }
    const timer = setInterval(() => {
      setShown(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      onSpinTick?.();
    }, 110);
    return () => clearInterval(timer);
  }, [spinning, letter, onSpinTick]);

  const urgent = !spinning && seconds <= 5;
  const color = spinning ? "#34c759" : ringColor(fraction);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE + 18 }}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS + 2} fill="rgb(28 8 66 / 0.85)" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction)))}
          style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ height: SIZE }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={spinning ? `spin-${shown}` : `letter-${letter}`}
            initial={spinning ? { y: -24, opacity: 0.4 } : { scale: 0.4, rotate: -12 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: 24, opacity: 0 }}
            transition={
              spinning ? { duration: 0.08 } : { type: "spring", stiffness: 420, damping: 14 }
            }
            className="letter-tile flex size-[118px] items-center justify-center rounded-[28px]"
          >
            <span
              className="font-[family-name:var(--font-display)] text-[92px] leading-none text-[#3a1a00]"
              style={{ textShadow: "0 3px 0 rgb(255 255 255 / 0.5)" }}
            >
              {shown}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        className={cn(
          "absolute left-1/2 flex h-[44px] min-w-[58px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-ink px-2",
          urgent ? "animate-pulse-ring bg-stop text-white" : "bg-white text-ink",
        )}
        style={{ top: SIZE - 32 }}
      >
        <span className="font-[family-name:var(--font-display)] text-[26px] leading-none">
          {seconds}
          <span className="text-[16px]">s</span>
        </span>
      </div>
    </div>
  );
}
