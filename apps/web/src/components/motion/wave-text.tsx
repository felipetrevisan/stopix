import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Texto com as letras em onda (cada uma sobe e desce depois da anterior). Espaços viram
 * espaço normal para a quebra de linha continuar funcionando.
 */
export function WaveText({
  text,
  className,
  amplitude = 5,
}: {
  text: string;
  className?: string;
  /** Quanto cada letra sobe, em px. */
  amplitude?: number;
}) {
  let index = 0;
  return (
    <span
      className={cn("wave-text", className)}
      style={{ "--wave-amp": `${-amplitude}px` } as CSSProperties}
      aria-label={text}
    >
      {[...text].map((char, position) => {
        if (char === " ") return " ";
        index += 1;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: letras fixas do texto
          <span key={position} aria-hidden style={{ "--i": index } as CSSProperties}>
            {char}
          </span>
        );
      })}
    </span>
  );
}
