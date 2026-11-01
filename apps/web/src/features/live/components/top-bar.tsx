"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "../chat-source";
import { BrandLogo } from "./brand-mark";

const STATUS_LABEL: Partial<Record<ChatStatus, string>> = {
  connecting: "Conectando ao chat…",
  offline: "Chat desconectado",
  "not-configured": "Neon não configurado",
};

/** Bolinhas das rodadas (até 12); acima disso, "3/20". */
function RoundPips({ round, total }: { round: number; total: number }) {
  if (total > 12) {
    return (
      <span className="text-[13px] font-extrabold text-white/90">
        Rodada <span className="text-aqua-light">{round}</span>/{total}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1" aria-label={`Rodada ${round} de ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: posição fixa
          key={index}
          className={cn(
            "h-2 rounded-full transition-all",
            index + 1 < round && "w-2 bg-aqua",
            index + 1 === round && "w-5 bg-white shadow-[0_0_10px_#5eead4]",
            index + 1 > round && "w-2 bg-white/20",
          )}
        />
      ))}
    </span>
  );
}

/** Topo do palco: marca, rodadas e quem está assistindo. */
export function TopBar({
  round,
  totalRounds,
  viewers,
  chat,
}: {
  round: number;
  totalRounds: number;
  viewers: number;
  chat: ChatStatus;
}) {
  const warning = STATUS_LABEL[chat];
  return (
    <div className="absolute inset-x-0 top-0 flex h-[60px] items-center justify-between px-5">
      <BrandLogo />
      {warning ? (
        <span className="rounded-full bg-hot/90 px-2.5 py-1 text-[11px] font-bold text-white">
          {warning}
        </span>
      ) : null}
      <div className="glass flex items-center gap-3 rounded-full px-3 py-1.5">
        <RoundPips round={round} total={totalRounds} />
        {viewers > 0 ? (
          <span className="flex items-center gap-1 border-l border-white/15 pl-3 text-[13px] font-bold text-white/90">
            <Users className="size-3.5 text-aqua-light" strokeWidth={2.5} />
            {viewers}
          </span>
        ) : null}
      </div>
    </div>
  );
}
