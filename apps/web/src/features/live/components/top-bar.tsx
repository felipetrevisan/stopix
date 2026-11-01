"use client";

import { Users } from "lucide-react";
import type { ChatStatus } from "../chat-source";
import { BrandMark } from "./brand-mark";

const STATUS_LABEL: Partial<Record<ChatStatus, string>> = {
  connecting: "Conectando ao chat…",
  offline: "Chat desconectado",
  "not-configured": "Chat indisponível",
};

/** Topo do palco: marca, ao vivo, quem está assistindo e a rodada. */
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
    <div className="absolute inset-x-0 top-0 flex h-[56px] items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <BrandMark size={36} className="drop-shadow-[0_3px_0_#120a3a]" />
        <span className="game-text-sm text-[22px] text-white italic">Stopix</span>
        <span className="rounded-full border-2 border-[#120a3a] bg-aqua px-2 text-[12px] font-black text-[#120a3a]">
          LIVE
        </span>
      </div>
      {warning ? (
        <span className="rounded-full bg-hot px-2.5 py-1 text-[11px] font-bold text-white">
          {warning}
        </span>
      ) : null}
      <div className="flex items-center gap-1.5">
        {viewers > 0 ? (
          <span className="flex items-center gap-1 rounded-full border-2 border-[#120a3a] bg-[#120a3a]/70 px-2 py-0.5 text-[13px] font-black text-white">
            <Users className="size-3.5 text-aqua-light" strokeWidth={3} />
            {viewers}
          </span>
        ) : null}
        <span className="rounded-full border-2 border-[#120a3a] bg-white px-2.5 py-0.5 text-[13px] font-black text-[#120a3a] shadow-[0_2px_0_#120a3a]">
          RODADA {round}/{totalRounds}
        </span>
      </div>
    </div>
  );
}
