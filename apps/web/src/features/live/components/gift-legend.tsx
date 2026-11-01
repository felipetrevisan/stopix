"use client";

import { GIFT_EFFECTS, type GiftAmounts, type GiftEffect } from "@stopix/game-core";
import { motion } from "motion/react";
import type { GiftCatalog } from "../chat-source";
import { giftImage } from "../gift-catalog";

export const EFFECT_EMOJI: Record<GiftEffect, string> = {
  time: "⏱️",
  freeze: "❄️",
  letter: "🔤",
  category: "🔀",
  double: "✨",
};

export const effectLabel = (effect: GiftEffect, amounts: GiftAmounts) =>
  ({
    time: `Mais ${amounts.timeSec}s`,
    freeze: `Congela ${amounts.freezeSec}s`,
    letter: "Troca letra",
    category: "Troca categoria",
    double: "Dobro de pontos",
  })[effect];

/** Ícone do presente: a imagem do TikTok quando já apareceu na live; senão, o emoji do efeito. */
export function GiftIcon({
  effect,
  image,
  size,
}: {
  effect: GiftEffect;
  image?: string;
  size: number;
}) {
  if (image) {
    return (
      // biome-ignore lint/performance/noImgElement: imagem externa do presente
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="object-contain"
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.72 }}
    >
      {EFFECT_EMOJI[effect]}
    </span>
  );
}

/** Lista de presentes da rodada: ícone, quantos chegaram e o que cada um faz. */
export function GiftLegend({
  names,
  amounts,
  counts,
  catalog,
}: {
  names: Record<GiftEffect, string>;
  amounts: GiftAmounts;
  counts: Partial<Record<GiftEffect, number>>;
  catalog: GiftCatalog;
}) {
  return (
    <motion.div
      initial={{ x: 220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="w-[196px] rounded-[22px] border-2 border-white/15 bg-[#120a3a]/75 px-2.5 py-2 backdrop-blur-sm"
    >
      {GIFT_EFFECTS.map((effect, index) => {
        const count = counts[effect] ?? 0;
        return (
          <motion.div
            key={effect}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 + index * 0.08 }}
            className="flex h-[43px] items-center gap-2"
          >
            <span className="relative shrink-0">
              <span className="animate-bob block" style={{ animationDelay: `${index * -0.6}s` }}>
                <GiftIcon effect={effect} image={giftImage(names[effect], catalog)} size={36} />
              </span>
              <motion.span
                key={count}
                initial={{ scale: count ? 1.8 : 1 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#120a3a] bg-white px-1 text-[10px] font-black text-[#120a3a]"
              >
                {count}
              </motion.span>
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-extrabold text-white">
                {effectLabel(effect, amounts)}
              </span>
              <span className="block truncate text-[10px] font-semibold text-white/50">
                {names[effect]}
              </span>
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
