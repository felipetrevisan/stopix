"use client";

import type { Answer } from "@stopix/game-core";
import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export const VISIBLE_ANSWERS = 8;

function PointsBadge({ answer }: { answer: Answer }) {
  if (answer.kind === "repeated") {
    return (
      <span className="flex flex-col items-center leading-none">
        <span className="mb-0.5 rounded bg-ink/80 px-1 py-px text-[8px] font-black tracking-wide text-white/90">
          REPETIDA
        </span>
        <span className="rounded-md bg-amber px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[14px] text-white shadow-[0_2px_0_#8a4b00]">
          +{answer.points}
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[15px] text-white",
        answer.kind === "first" ? "bg-[#ff6b00] shadow-[0_2px_0_#8a3000]" : "pill-green",
      )}
    >
      +{answer.points}
    </span>
  );
}

function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.6, opacity: 0, x: -30 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "card-answer flex h-[52px] items-center gap-2 rounded-xl px-1.5",
        answer.kind === "first" && "card-answer-first",
      )}
    >
      <Avatar player={answer.player} size={38} className="border-2 border-white shadow" />
      <div className="min-w-0 flex-1 leading-none">
        <p className="truncate text-[10px] font-bold text-[#6b5a92]">{answer.player.name}</p>
        <p className="truncate font-[family-name:var(--font-display)] text-[19px] uppercase text-[#3a1078]">
          {answer.word}
        </p>
      </div>
      <PointsBadge answer={answer} />
    </motion.div>
  );
}

/** Quem acertou na rodada, os mais novos primeiro. */
export function AnswersGrid({ answers }: { answers: Answer[] }) {
  if (!answers.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 pb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-7 fill-white text-white" />
          <span className="game-text text-[30px] text-white">Comente sua resposta!</span>
        </div>
        <span className="text-[14px] font-extrabold text-white/85">
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
            <AnswerCard key={answer.player.id} answer={answer} />
          ))}
        </AnimatePresence>
      </div>
      {hidden > 0 ? (
        <span className="absolute right-3 -bottom-0.5 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-black text-white">
          +{hidden} acertos
        </span>
      ) : null}
    </div>
  );
}
