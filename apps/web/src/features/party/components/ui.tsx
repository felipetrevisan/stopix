"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RoomPlayer } from "../room";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("glass rounded-3xl p-4", className)}>{children}</section>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-[11px] font-extrabold tracking-[0.18em] text-aqua-light uppercase",
        className,
      )}
    >
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
        "grad-brand flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-extrabold text-white shadow-[0_8px_24px_rgb(59_130_246_/_0.4)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none",
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
        "flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 text-[14px] font-bold text-white transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-40",
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
      className="letter-box flex shrink-0 items-center justify-center rounded-[30%]"
      style={{ width: size, height: size }}
    >
      <span className="letter-glyph leading-none" style={{ fontSize: size * 0.68 }}>
        {letter}
      </span>
    </span>
  );
}

export function PlayerAvatar({ player, size = 36 }: { player?: RoomPlayer; size?: number }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/10",
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
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", hot ? "bar-fill-hot" : "bar-fill")}
          style={{ width: `${clamped * 100}%`, transition: "width 0.25s linear" }}
        />
      </div>
      <span
        className={cn(
          "w-[46px] text-right text-[20px] font-black tabular-nums",
          hot ? "text-hot" : "text-white",
        )}
      >
        {seconds}
        <span className="text-[12px] text-white/60">s</span>
      </span>
    </div>
  );
}

export const playerName = (players: RoomPlayer[], id: string | null | undefined) =>
  players.find((player) => player.id === id)?.name ?? "Alguém";
