import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Duas cristas por largura: andar metade da largura fecha o ciclo sem emenda.
const wavePath = (height: number, amp: number) => {
  const w = 1200;
  let d = `M0 ${amp}`;
  for (let x = 0; x < w * 2; x += 300) {
    d += ` Q ${x + 75} 0 ${x + 150} ${amp} T ${x + 300} ${amp}`;
  }
  return `${d} V ${height} H 0 Z`;
};

const LAYERS = [
  { color: "rgb(139 92 246 / 0.28)", height: 120, amp: 22, duration: 18, bottom: 0 },
  { color: "rgb(59 130 246 / 0.28)", height: 96, amp: 18, duration: 13, bottom: 0 },
  { color: "rgb(45 212 191 / 0.22)", height: 70, amp: 14, duration: 9, bottom: 0 },
];

const BUBBLES = [
  { left: "8%", size: 14, duration: 16, delay: 0 },
  { left: "22%", size: 8, duration: 12, delay: -5 },
  { left: "41%", size: 18, duration: 20, delay: -9 },
  { left: "63%", size: 10, duration: 14, delay: -2 },
  { left: "79%", size: 16, duration: 18, delay: -12 },
  { left: "92%", size: 7, duration: 11, delay: -7 },
];

/** Ondas andando no pé da tela e bolhas subindo, atrás de tudo. */
export function StageWaves({
  className,
  bubbles = true,
}: {
  className?: string;
  bubbles?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {bubbles
        ? BUBBLES.map((bubble) => (
            <span
              key={bubble.left}
              className="bubble"
              style={
                {
                  left: bubble.left,
                  width: bubble.size,
                  height: bubble.size,
                  animationDuration: `${bubble.duration}s`,
                  animationDelay: `${bubble.delay}s`,
                } as CSSProperties
              }
            />
          ))
        : null}
      {LAYERS.map((layer) => (
        <svg
          key={layer.duration}
          className="wave-layer absolute left-0"
          style={{
            bottom: layer.bottom,
            width: "200%",
            height: layer.height,
            animationDuration: `${layer.duration}s`,
          }}
          viewBox={`0 0 2400 ${layer.height}`}
          preserveAspectRatio="none"
        >
          <path d={wavePath(layer.height, layer.amp)} fill={layer.color} />
        </svg>
      ))}
    </div>
  );
}
