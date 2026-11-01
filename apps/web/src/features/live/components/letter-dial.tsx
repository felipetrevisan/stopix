"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJLMNOPRSTUV";
const SIZE = 214;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2 - 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ringColor = (fraction: number) =>
  fraction > 0.5 ? "#2dd4bf" : fraction > 0.25 ? "#8b5cf6" : "#f43f5e";

/**
 * Letra no anel do tempo. Sorteando, as letras correm; valendo, o anel esvazia
 * (verde-água → roxo → rosa). Congelado fica azul-gelo; em dobro aparece o selo 2X.
 */
export function LetterDial({
  letter,
  spinning,
  fraction,
  seconds,
  frozen,
  double,
  onSpinTick,
}: {
  letter: string;
  spinning: boolean;
  fraction: number;
  seconds: number;
  frozen: boolean;
  double: boolean;
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
    }, 100);
    return () => clearInterval(timer);
  }, [spinning, letter, onSpinTick]);

  const clamped = Math.max(0, Math.min(1, fraction));
  const color = frozen ? "#bae6fd" : spinning ? "#2dd4bf" : ringColor(clamped);
  const urgent = !spinning && !frozen && seconds <= 5;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE + 16 }}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="#120a3a" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
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
          strokeDashoffset={CIRCUMFERENCE * (1 - (spinning ? 1 : clamped))}
          style={{
            transition: "stroke-dashoffset 0.25s linear, stroke 0.4s",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center" style={{ height: SIZE }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={spinning ? `spin-${shown}` : `letter-${letter}`}
            initial={spinning ? { y: -30, opacity: 0.3 } : { scale: 0.3, rotate: -15 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: 30, opacity: 0 }}
            transition={
              spinning ? { duration: 0.08 } : { type: "spring", stiffness: 420, damping: 14 }
            }
            className="chunky-tile relative flex size-[128px] items-center justify-center overflow-hidden rounded-[30px]"
          >
            <span className="game-text text-[98px] leading-none text-white">{shown}</span>
            {frozen ? (
              <span className="absolute inset-0 flex items-start justify-end bg-sky-200/35 p-1.5 text-[24px] backdrop-blur-[1px]">
                ❄️
              </span>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {double ? (
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: -12 }}
          className="chunky-pill absolute top-2 left-0 flex size-[58px] items-center justify-center rounded-full"
          style={{ background: "linear-gradient(180deg,#c4b5fd,#8b5cf6)" }}
        >
          <span className="game-text-sm text-[24px] text-white">2X</span>
        </motion.span>
      ) : null}

      <div
        className={cn(
          "absolute left-1/2 flex h-[46px] min-w-[70px] -translate-x-1/2 items-center justify-center rounded-full border-[4px] border-[#120a3a] px-2.5 shadow-[0_4px_0_#120a3a]",
          frozen
            ? "bg-sky-200 text-[#0c4a6e]"
            : urgent
              ? "animate-pulse bg-hot text-white"
              : "bg-white text-[#120a3a]",
        )}
        style={{ top: SIZE - 30 }}
      >
        <span className="text-[28px] leading-none font-black tabular-nums">
          {seconds}
          <span className="text-[16px]">s</span>
        </span>
      </div>
    </div>
  );
}
