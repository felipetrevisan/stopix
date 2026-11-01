import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Duas cristas por largura: andar metade da largura fecha o ciclo sem emenda.
const wavePath = (height: number, amp: number, period: number) => {
  let d = `M0 ${amp}`;
  for (let x = 0; x < 2400; x += period) {
    d += ` Q ${x + period / 4} 0 ${x + period / 2} ${amp} T ${x + period} ${amp}`;
  }
  return `${d} V ${height} H 0 Z`;
};

type Layer = { color: string; height: number; amp: number; period: number; duration: number };

/** Fundo das telas do celular (modo amigos): ondas fortes, um pouco mais baixas que as da live. */
const SOFT: Layer[] = [
  { color: "rgb(139 92 246 / 0.4)", height: 260, amp: 30, period: 400, duration: 20 },
  { color: "rgb(59 130 246 / 0.38)", height: 205, amp: 24, period: 300, duration: 14 },
  { color: "rgb(45 212 191 / 0.32)", height: 150, amp: 20, period: 240, duration: 10 },
  { color: "rgb(45 212 191 / 0.45)", height: 64, amp: 14, period: 200, duration: 7 },
];

/** Overlay da live: ondas altas, que aparecem em volta e por trás do ranking. */
const TALL: Layer[] = [
  { color: "rgb(139 92 246 / 0.42)", height: 330, amp: 34, period: 400, duration: 20 },
  { color: "rgb(59 130 246 / 0.4)", height: 270, amp: 28, period: 300, duration: 14 },
  { color: "rgb(45 212 191 / 0.34)", height: 210, amp: 24, period: 240, duration: 10 },
];

/** Faixa da frente, no pé da tela, passando por cima da borda de baixo do ranking. */
const FRONT: Layer[] = [
  { color: "rgb(59 130 246 / 0.55)", height: 58, amp: 16, period: 300, duration: 9 },
  { color: "rgb(45 212 191 / 0.6)", height: 40, amp: 12, period: 240, duration: 6 },
];

const LAYERS = { soft: SOFT, tall: TALL, front: FRONT };

const BUBBLES = [
  { left: "8%", size: 14, duration: 16, delay: 0 },
  { left: "22%", size: 8, duration: 12, delay: -5 },
  { left: "41%", size: 18, duration: 20, delay: -9 },
  { left: "63%", size: 10, duration: 14, delay: -2 },
  { left: "79%", size: 16, duration: 18, delay: -12 },
  { left: "92%", size: 7, duration: 11, delay: -7 },
];

/** Ondas andando no pé da tela e (opcional) bolhas subindo. */
export function StageWaves({
  className,
  variant = "soft",
  bubbles = variant !== "front",
}: {
  className?: string;
  variant?: keyof typeof LAYERS;
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
      {LAYERS[variant].map((layer) => (
        <svg
          key={layer.duration}
          className="wave-layer absolute bottom-0 left-0"
          style={{ width: "200%", height: layer.height, animationDuration: `${layer.duration}s` }}
          viewBox={`0 0 2400 ${layer.height}`}
          preserveAspectRatio="none"
        >
          <path d={wavePath(layer.height, layer.amp, layer.period)} fill={layer.color} />
        </svg>
      ))}
    </div>
  );
}
