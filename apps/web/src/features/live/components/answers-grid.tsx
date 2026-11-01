"use client";

import type { Answer } from "@stopix/game-core";
import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export const VISIBLE_ANSWERS = 8;

const BADGE: Record<Answer["kind"], string> = {
  first: "bg-gradient-to-b from-[#a78bfa] to-[#7c3aed]",
  new: "bg-gradient-to-b from-[#60a5fa] to-[#2563eb]",
  repeated: "bg-gradient-to-b from-[#94a3b8] to-[#64748b]",
};

function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.5, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      className={cn(
        "card-light flex h-[50px] items-center gap-1.5 rounded-[14px] pr-1.5 pl-1",
        answer.kind === "first" && "card-first",
      )}
    >
      <Avatar player={answer.player} size={38} className="border-[2.5px] border-[#120a3a]" />
      <div className="min-w-0 flex-1 leading-none">
        <p className="truncate text-[10px] font-bold text-[#5b4b8a]">{answer.player.name}</p>
        <p className="truncate text-[18px] font-black text-[#1e1052] uppercase">{answer.word}</p>
      </div>
      <span className="flex flex-col items-center leading-none">
        {answer.kind === "repeated" ? (
          <span className="mb-0.5 text-[8px] font-black tracking-wide text-[#5b4b8a]">
            REPETIDA
          </span>
        ) : null}
        <span
          className={cn(
            "rounded-lg border-2 border-[#120a3a] px-1.5 py-0.5 text-[14px] font-black text-white",
            BADGE[answer.kind],
          )}
        >
          +{answer.points}
        </span>
      </span>
    </motion.div>
  );
}

/** Quem acertou no quadro atual, os mais novos primeiro. */
export function AnswersGrid({ answers }: { answers: Answer[] }) {
  if (!answers.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-8 fill-white text-[#120a3a]" strokeWidth={2.5} />
          <span className="game-text text-[30px] text-white">Comenta aí!</span>
        </div>
        <span className="text-[14px] font-bold text-white/85">
          Quem acertar aparece aqui com a foto
        </span>
      </div>
    );
  }
  const visible = [...answers].reverse().slice(0, VISIBLE_ANSWERS);
  const hidden = answers.length - visible.length;
  return (
    <div className="relative h-full px-3">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((answer) => (
            <AnswerCard key={`${answer.player.id}-${answer.at}`} answer={answer} />
          ))}
        </AnimatePresence>
      </div>
      {hidden > 0 ? (
        <span className="absolute -bottom-1 right-3 rounded-full border-2 border-[#120a3a] bg-aqua px-2 text-[11px] font-black text-[#120a3a]">
          +{hidden} acertos
        </span>
      ) : null}
    </div>
  );
}
