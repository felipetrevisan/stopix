"use client";

import { Hand } from "lucide-react";
import { motion } from "motion/react";

/** Tempo esgotado: mão de "pare" num círculo pulsando e a conferência das respostas. */
export function StopScreen({ answered }: { answered: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-night/70 backdrop-blur-[3px]"
    >
      <div className="relative flex size-[260px] items-center justify-center">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="absolute inset-0 rounded-full border-2 border-aqua/60"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="grad-brand flex size-[190px] items-center justify-center rounded-full shadow-[0_0_60px_rgb(59_130_246_/_0.7)]"
        >
          <Hand className="size-[96px] text-white" strokeWidth={2.2} />
        </motion.div>
      </div>
      <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
        className="grad-text -mt-2 text-[96px] leading-none font-black tracking-tighter italic"
      >
        STOP!
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
        className="mt-4 text-[20px] font-bold text-white/90"
      >
        {answered > 0
          ? `Conferindo ${answered} ${answered === 1 ? "resposta" : "respostas"}…`
          : "Tempo esgotado!"}
      </motion.span>
    </motion.div>
  );
}
