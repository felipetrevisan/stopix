"use client";

import { Users } from "lucide-react";
import type { ChatStatus } from "../chat-source";
import { StopOctagon } from "./stop-octagon";

const STATUS_LABEL: Partial<Record<ChatStatus, string>> = {
  connecting: "Conectando ao chat…",
  offline: "Chat desconectado",
  "not-configured": "Neon não configurado",
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
    <div className="absolute inset-x-0 top-0 flex h-[52px] items-center justify-between px-4">
      <div className="flex items-center gap-1.5">
        <StopOctagon size={34} label="STOP" />
        <span className="game-text-sm rounded-full bg-[#ffd23f] px-2.5 py-0.5 text-[15px] text-white">
          LIVE
        </span>
      </div>
      {warning ? (
        <span className="rounded-full bg-stop/90 px-2.5 py-1 text-[11px] font-extrabold text-white">
          {warning}
        </span>
      ) : null}
      <div className="flex items-center gap-1.5">
        {viewers > 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[13px] font-extrabold text-white">
            <Users className="size-3.5" strokeWidth={3} />
            {viewers}
          </span>
        ) : null}
        <span className="rounded-full border-2 border-white/80 bg-white px-2.5 py-0.5 font-[family-name:var(--font-display)] text-[14px] text-ink">
          RODADA {round}/{totalRounds}
        </span>
      </div>
    </div>
  );
}
