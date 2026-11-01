"use client";

import { motion } from "motion/react";
import { StopOctagon } from "./stop-octagon";

/** Tempo esgotado: placa de STOP por cima de tudo e a conferência das respostas. */
export function StopScreen({ answered }: { answered: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-night/55 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ scale: 3, rotate: -40, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 13 }}
        className="relative drop-shadow-[0_10px_0_rgb(18_8_42_/_0.6)]"
      >
        <StopOctagon size={250} />
        <span
          className="game-text absolute inset-0 flex items-center justify-center text-[74px] text-white"
          style={{ WebkitTextStroke: "5px #1b0b3a" }}
        >
          STOP!
        </span>
      </motion.div>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <motion.span
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
          className="game-text text-[28px] text-white"
        >
          {answered > 0
            ? `Conferindo ${answered} ${answered === 1 ? "resposta" : "respostas"}…`
            : "Tempo esgotado!"}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
