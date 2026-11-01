"use client";

import { useEffect, useState } from "react";

/** Relógio que re-renderiza a cada `intervalMs` (contagens regressivas). */
export function useNow(intervalMs = 200) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Segundos que faltam (arredondado para cima, nunca negativo). */
export const secondsLeft = (endsAt: number, now: number) =>
  Math.max(0, Math.ceil((endsAt - now) / 1000));
