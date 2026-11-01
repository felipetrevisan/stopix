"use client";

import type { Player } from "@stopix/game-core";
import { useState } from "react";
import { cn } from "@/lib/utils";

const COLORS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#0ea5e9", "#6366f1", "#0d9488", "#7c3aed"];

const colorOf = (id: string) => {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
};

const initials = (name: string) =>
  [...name.replace(/[^\p{L}\p{N}]/gu, "")].slice(0, 2).join("").toUpperCase() || "?";

/** Foto de quem respondeu (a do TikTok, quando vem); sem foto, as iniciais. */
export function Avatar({
  player,
  size,
  className,
}: {
  player: Player;
  size: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (player.avatar && !broken) {
    return (
      // biome-ignore lint/performance/noImgElement: foto externa do TikTok, sem otimização
      <img
        src={player.avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-black text-white",
        className,
      )}
      style={{ ...style, background: colorOf(player.id) }}
    >
      {initials(player.name)}
    </span>
  );
}
