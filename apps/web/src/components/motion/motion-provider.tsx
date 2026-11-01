"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Quem pediu menos movimento no aparelho vê as telas sem as animações grandes. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
