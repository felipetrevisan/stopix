"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RoomPlayer } from "../room";

export function Card({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Atraso da entrada (para entrarem um depois do outro). */
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ y: 28, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay }}
      className={cn("chunky rounded-[24px] p-4", className)}
    >
      {children}
    </motion.section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("game-text-sm text-[14px] tracking-wide text-aqua-light", className)}>
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "chunky-pill game-text-sm flex h-13 items-center justify-center gap-2 rounded-2xl px-5 text-[18px] text-white transition active:translate-y-[3px] active:shadow-[0_1px_0_#120a3a] disabled:opacity-45 disabled:active:translate-y-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-2xl border-[3px] border-[#120a3a] bg-white px-4 text-[14px] font-black text-[#120a3a] shadow-[0_3px_0_#120a3a] transition active:translate-y-[2px] active:shadow-[0_1px_0_#120a3a] disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LetterTile({ letter, size = 56 }: { letter: string; size?: number }) {
  return (
    <span
      className="chunky-tile flex shrink-0 items-center justify-center rounded-[28%]"
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2.5, size / 26),
        boxShadow: `0 ${Math.max(3, size / 20)}px 0 #120a3a, inset 0 ${Math.max(2, size / 28)}px 0 rgb(255 255 255 / 0.45)`,
      }}
    >
      <span
        className="game-text leading-none text-white"
        style={{ fontSize: size * 0.7, WebkitTextStroke: `${Math.max(2.5, size / 26)}px #120a3a` }}
      >
        {letter}
      </span>
    </span>
  );
}

export function PlayerAvatar({ player, size = 36 }: { player?: RoomPlayer; size?: number }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#120a3a] bg-gradient-to-b from-white to-[#e0e7ff]",
        player && !player.online && "opacity-40 grayscale",
      )}
      style={{ width: size, height: size, fontSize: size * 0.58 }}
    >
      {player?.avatar ?? "👤"}
    </span>
  );
}

export function TimerBar({ fraction, seconds }: { fraction: number; seconds: number }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const hot = clamped <= 0.2;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-4 flex-1 overflow-hidden rounded-full border-[2.5px] border-[#120a3a] bg-[#120a3a]/60">
        <div
          className={cn("h-full rounded-full", hot ? "bar-fill-hot" : "bar-fill")}
          style={{ width: `${clamped * 100}%`, transition: "width 0.25s linear" }}
        />
      </div>
      <span
        className={cn(
          "flex h-9 min-w-[58px] items-center justify-center rounded-full border-[3px] border-[#120a3a] px-2 text-[20px] font-black tabular-nums shadow-[0_3px_0_#120a3a]",
          hot ? "animate-pulse bg-hot text-white" : "bg-white text-[#120a3a]",
        )}
      >
        {seconds}
        <span className="text-[12px]">s</span>
      </span>
    </div>
  );
}

export const playerName = (players: RoomPlayer[], id: string | null | undefined) =>
  players.find((player) => player.id === id)?.name ?? "Alguém";
