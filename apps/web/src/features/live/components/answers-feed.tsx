"use client";

import type { Answer } from "@stopix/game-core";
import { Check, MessageSquareText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export const VISIBLE_ANSWERS = 6;

const TAG: Record<Answer["kind"], { className: string; label: string }> = {
  first: { className: "tag-first", label: "1ª" },
  new: { className: "tag-new", label: "nova" },
  repeated: { className: "tag-repeated", label: "repetida" },
};

function AnswerRow({ answer }: { answer: Answer }) {
  const tag = TAG[answer.kind];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "flex h-[42px] items-center gap-2.5 rounded-2xl pr-2 pl-1.5",
        answer.kind === "first"
          ? "border border-aqua/60 bg-aqua/15 shadow-[0_0_18px_rgb(45_212_191_/_0.35)]"
          : "bg-white/[0.06]",
      )}
    >
      <Avatar player={answer.player} size={32} className="ring-2 ring-white/25" />
      <span className="min-w-0 flex-1 truncate">
        <span className="text-[19px] font-extrabold tracking-tight text-white capitalize">
          {answer.word}
        </span>
        <span className="ml-2 text-[12px] font-medium text-white/55">{answer.player.name}</span>
      </span>
      <span className="text-[10px] font-bold tracking-wider text-white/45 uppercase">
        {tag.label}
      </span>
      <span
        className={cn(
          "min-w-[54px] rounded-full px-2 py-0.5 text-center text-[14px] font-black",
          tag.className,
        )}
      >
        +{answer.points}
      </span>
    </motion.li>
  );
}

/** Feed de quem acertou na rodada, o mais novo em cima. */
export function AnswersFeed({ answers }: { answers: Answer[] }) {
  const visible = [...answers].reverse().slice(0, VISIBLE_ANSWERS);
  return (
    <div className="mx-4 flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[12px] font-extrabold tracking-[0.16em] text-aqua-light uppercase">
          <Check className="size-4" strokeWidth={3} /> Acertos da rodada
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-black text-white">
          {answers.length}
        </span>
      </div>
      {answers.length ? (
        <ul className="flex flex-col gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((answer) => (
              <AnswerRow key={answer.player.id} answer={answer} />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-white/15">
          <MessageSquareText className="size-10 text-aqua-light" />
          <span className="text-[24px] font-black tracking-tight text-white">
            Responda no chat!
          </span>
          <span className="text-[14px] font-medium text-white/65">
            Quem acertar aparece aqui com a foto
          </span>
        </div>
      )}
    </div>
  );
}
