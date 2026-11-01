"use client";

import { type ReviewedAnswer, getCategory, partyRanking } from "@stopix/game-core";
import { ArrowRight, Crown, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Confetti } from "@/features/live/components/confetti";
import { secondsLeft, useNow } from "@/features/live/components/use-now";
import { cn } from "@/lib/utils";
import type { Room } from "../use-room";
import { Card, Eyebrow, LetterTile, PlayerAvatar, PrimaryButton, playerName } from "./ui";

const KIND_LABEL: Record<NonNullable<ReviewedAnswer["kind"]>, string> = {
  unique: "única",
  repeated: "repetida",
  alone: "só você",
};

function Standings({ room, deltas }: { room: Room; deltas?: Record<string, number> }) {
  const ranking = partyRanking(room.state.totals);
  const max = Math.max(1, ranking[0]?.points ?? 1);
  return (
    <ol className="flex flex-col gap-1.5">
      {ranking.map((entry, index) => {
        const player = room.players.find((item) => item.id === entry.playerId);
        return (
          <motion.li
            key={entry.playerId}
            layout
            className="relative flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl px-3"
          >
            <motion.span
              className={cn(
                "absolute inset-y-0 left-0 rounded-2xl",
                index === 0 ? "grad-brand opacity-50" : "bg-white/[0.08]",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(10, (entry.points / max) * 100)}%` }}
            />
            <span
              className={cn(
                "relative w-5 text-[17px] font-black",
                index === 0 ? "text-aqua-light" : "text-white/55",
              )}
            >
              {index + 1}
            </span>
            <PlayerAvatar player={player} size={30} />
            <span className="relative min-w-0 flex-1 truncate text-[15px] font-bold">
              {player?.name ?? "Saiu"}
              {entry.playerId === room.me ? <span className="text-white/45"> (você)</span> : null}
            </span>
            {deltas?.[entry.playerId] ? (
              <span className="relative text-[13px] font-black text-aqua-light">
                +{deltas[entry.playerId]}
              </span>
            ) : null}
            <span className="relative w-12 text-right text-[18px] font-black tabular-nums">
              {entry.points}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** Placar depois da conferência: pontos da rodada, palavra por palavra, e o geral. */
export function Scores({ room }: { room: Room }) {
  const { state } = room;
  useNow(500);
  const seconds = secondsLeft(state.endsAt, room.serverNow());
  const results = state.results;
  const last = state.round >= state.totalRounds;
  const deltas = Object.fromEntries(
    Object.entries(results?.players ?? {}).map(([id, player]) => [id, player.total]),
  );
  const mine = room.me ? results?.players[room.me] : undefined;

  return (
    <div className="flex flex-col gap-3 pb-28">
      <Card className="flex items-center gap-3">
        <LetterTile letter={state.letter} size={52} />
        <div>
          <Eyebrow>
            Rodada {state.round} de {state.totalRounds}
          </Eyebrow>
          <p className="text-[14px] text-white/75">
            {results?.stoppedBy
              ? `${playerName(room.players, results.stoppedBy)} pediu STOP`
              : "Acabou o tempo"}
          </p>
        </div>
      </Card>

      <Card>
        <Eyebrow>Placar</Eyebrow>
        <div className="mt-3">
          <Standings room={room} deltas={deltas} />
        </div>
      </Card>

      {mine ? (
        <Card>
          <div className="flex items-center justify-between">
            <Eyebrow>Seus pontos na rodada</Eyebrow>
            <span className="grad-text text-[26px] font-black">+{mine.total}</span>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {state.categories.map((id) => {
              const answer = mine.answers[id];
              const category = getCategory(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2 text-[14px]"
                >
                  <span className="w-6">{category?.emoji}</span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-bold capitalize",
                      !answer?.accepted && "text-white/40",
                    )}
                  >
                    {answer?.word ?? (answer?.text || "—")}
                  </span>
                  {answer?.kind ? (
                    <span className="text-[11px] font-bold text-white/50 uppercase">
                      {KIND_LABEL[answer.kind]}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "w-9 text-right font-black",
                      answer?.points ? "text-aqua-light" : "text-white/35",
                    )}
                  >
                    {answer?.points ? `+${answer.points}` : "0"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-night via-night/90 to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          {room.isHost ? (
            <PrimaryButton onClick={room.next} className="h-14 w-full text-[17px]">
              {last ? "Ver o campeão" : "Próxima rodada"} <ArrowRight className="size-5" />
              <span className="text-white/70">({seconds}s)</span>
            </PrimaryButton>
          ) : (
            <p className="py-3 text-center text-[14px] font-bold text-white/70">
              {last ? "O campeão sai" : "A próxima rodada começa"} em {seconds}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fim da partida: campeão e placar final. */
export function Final({ room }: { room: Room }) {
  const ranking = partyRanking(room.state.totals);
  const champion = room.players.find((player) => player.id === ranking[0]?.playerId);
  return (
    <div className="relative flex flex-col items-center gap-4 pb-10">
      {champion ? <Confetti count={90} /> : null}
      <Eyebrow className="mt-6">Fim de partida</Eyebrow>
      <span className="grad-text -mt-2 text-[56px] leading-none font-black tracking-tight italic">
        CAMPEÃO
      </span>
      {champion ? (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15 }}
          className="flex flex-col items-center"
        >
          <span className="relative flex size-[140px] items-center justify-center">
            <span className="ring-spin absolute inset-0 rounded-full" />
            <span className="absolute inset-[5px] rounded-full bg-deep" />
            <span className="relative text-[76px]">{champion.avatar}</span>
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-[30px] font-black">
            <Crown className="size-6 text-aqua-light" /> {champion.name}
          </span>
          <span className="text-[16px] font-bold text-aqua-light">{ranking[0].points} pontos</span>
        </motion.div>
      ) : null}
      <Card className="w-full">
        <Eyebrow>Placar final</Eyebrow>
        <div className="mt-3">
          <Standings room={room} />
        </div>
      </Card>
      {room.isHost ? (
        <PrimaryButton onClick={room.backToLobby} className="h-14 w-full text-[17px]">
          <RotateCcw className="size-5" /> Jogar de novo
        </PrimaryButton>
      ) : (
        <p className="text-center text-[14px] font-bold text-white/70">
          Esperando {playerName(room.players, room.hostId)} começar outra…
        </p>
      )}
    </div>
  );
}
