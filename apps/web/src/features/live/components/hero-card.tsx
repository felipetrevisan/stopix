"use client";

import type { Phase } from "@stopix/game-core";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJLMNOPRSTUV";

type Props = {
  phase: Phase;
  letter: string;
  category: { name: string; emoji: string; ask: string } | undefined;
  /** Quanto do tempo ainda resta (0–1). */
  fraction: number;
  seconds: number;
  onSpinTick?: () => void;
};

/** Selo pequeno em cima do cartão: o que está acontecendo agora. */
function StatusLabel({ phase }: { phase: Phase }) {
  const live = phase === "playing";
  const text =
    phase === "drawing"
      ? "Sorteando"
      : phase === "playing"
        ? "Valendo"
        : phase === "stop"
          ? "Tempo esgotado"
          : "Próxima rodada";
  return (
    <span
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.14em] uppercase",
        live ? "bg-aqua/20 text-aqua-light" : "bg-white/10 text-white/80",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-aqua" : "bg-white/60")}
      />
      {text}
    </span>
  );
}

/**
 * Cartão principal: a letra na caixa em degradê, a categoria, o pedido e a barra do
 * tempo embaixo (fica rosa nos últimos 25%).
 */
export function HeroCard({ phase, letter, category, fraction, seconds, onSpinTick }: Props) {
  const spinning = phase === "drawing";
  const [shown, setShown] = useState(letter);

  useEffect(() => {
    if (!spinning) {
      setShown(letter);
      return;
    }
    const timer = setInterval(() => {
      setShown(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      onSpinTick?.();
    }, 90);
    return () => clearInterval(timer);
  }, [spinning, letter, onSpinTick]);

  const clamped = Math.max(0, Math.min(1, fraction));
  const hot = phase === "playing" && clamped <= 0.25;
  const between = phase === "intermission" || phase === "results" || phase === "final";

  return (
    <div className="glass relative mx-4 overflow-hidden rounded-[30px] p-4">
      <div className="flex gap-4">
        <div className="letter-box relative flex size-[150px] shrink-0 items-center justify-center overflow-hidden rounded-[32px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={spinning ? `spin-${shown}` : `letter-${letter}`}
              initial={spinning ? { y: -60, opacity: 0 } : { scale: 1.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={
                spinning ? { duration: 0.08 } : { type: "spring", stiffness: 380, damping: 18 }
              }
              className="letter-glyph text-[112px] leading-none"
            >
              {shown}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <StatusLabel phase={phase} />
          <AnimatePresence mode="wait">
            <motion.div
              key={category?.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-[30px] leading-none">{category?.emoji}</span>
              <span className="text-[30px] leading-[1.05] font-black tracking-tight text-white">
                {category?.name}
              </span>
            </motion.div>
          </AnimatePresence>
          <p className="text-[16px] leading-snug font-medium text-white/85">
            {spinning ? (
              "Prepare o dedo: a letra já sai!"
            ) : between ? (
              <>
                Próxima rodada em <b className="text-aqua-light">{seconds}s</b>
              </>
            ) : (
              <>
                Mande no chat <b className="text-white">{category?.ask}</b> que comece com{" "}
                <b className="rounded-md bg-white px-1.5 text-blue-deep">{letter}</b>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full", hot ? "bar-fill-hot" : "bar-fill")}
            style={{
              width: `${(spinning ? 1 : clamped) * 100}%`,
              transition: "width 0.25s linear",
            }}
          />
        </div>
        <motion.span
          key={hot ? seconds : "calm"}
          initial={hot ? { scale: 1.5 } : false}
          animate={{ scale: 1 }}
          className={cn(
            "w-[64px] text-right text-[30px] leading-none font-black tabular-nums",
            hot ? "text-hot" : "text-white",
          )}
        >
          {seconds}
          <span className="text-[16px] font-bold text-white/60">s</span>
        </motion.span>
      </div>
    </div>
  );
}
