"use client";

import { checkAnswer, getCategory, tallyVotes, voteKey } from "@stopix/game-core";
import { Check, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { secondsLeft, useNow } from "@/features/live/components/use-now";
import { cn } from "@/lib/utils";
import type { RoomPlayer } from "../room";
import type { Room } from "../use-room";
import { Card, Eyebrow, LetterTile, PlayerAvatar, PrimaryButton, playerName } from "./ui";

/** Quem entra na conta da rodada: quem está online e quem respondeu. */
export const roundPlayers = (room: Room): RoomPlayer[] =>
  room.players.filter((player) => player.online || room.answers[player.id]);

function VoteButtons({
  room,
  playerId,
  categoryId,
}: {
  room: Room;
  playerId: string;
  categoryId: string;
}) {
  const ballots = room.votes[voteKey(playerId, categoryId)];
  const tally = tallyVotes(ballots, playerId);
  const mine = room.me ? ballots?.[room.me] : undefined;
  if (playerId === room.me) {
    return (
      <span className="flex items-center gap-2 text-[12px] font-bold text-white/60">
        <span className="flex items-center gap-0.5">
          <ThumbsUp className="size-3.5" />
          {tally.yes}
        </span>
        <span className="flex items-center gap-0.5">
          <ThumbsDown className="size-3.5" />
          {tally.no}
        </span>
      </span>
    );
  }
  const button =
    "flex h-8 items-center gap-1 rounded-xl px-2.5 text-[13px] font-black transition active:scale-95";
  return (
    <span className="flex gap-1.5">
      <button
        type="button"
        onClick={() => room.vote(playerId, categoryId, mine === true ? null : true)}
        className={cn(button, mine === true ? "bg-aqua text-night" : "bg-white/10")}
        aria-label="Vale"
      >
        <ThumbsUp className="size-4" /> {tally.yes}
      </button>
      <button
        type="button"
        onClick={() => room.vote(playerId, categoryId, mine === false ? null : false)}
        className={cn(button, mine === false ? "bg-hot text-white" : "bg-white/10")}
        aria-label="Não vale"
      >
        <ThumbsDown className="size-4" /> {tally.no}
      </button>
    </span>
  );
}

/** Conferência: todas as respostas, com votação nas palavras que não estão nas listas. */
export function Review({ room }: { room: Room }) {
  const { state, answers } = room;
  useNow(500);
  const seconds = secondsLeft(state.endsAt, room.serverNow());
  const people = roundPlayers(room);
  const pending = state.categories.reduce(
    (count, id) =>
      count +
      people.filter(
        (player) => checkAnswer(id, state.letter, answers[player.id]?.[id]).status === "unknown",
      ).length,
    0,
  );

  return (
    <div className="flex flex-col gap-3 pb-28">
      <Card className="flex items-center gap-3">
        <LetterTile letter={state.letter} size={52} />
        <div className="flex-1">
          <Eyebrow>Conferência · rodada {state.round}</Eyebrow>
          <p className="text-[14px] leading-snug text-white/75">
            {pending > 0 ? (
              <>
                <b className="text-white">{pending}</b>{" "}
                {pending === 1 ? "palavra está" : "palavras estão"} fora da nossa lista. Vale, a não
                ser que a maioria vote contra.
              </>
            ) : (
              "Tudo conferido pela lista. Só falta ver os pontos!"
            )}
          </p>
        </div>
      </Card>

      {state.categories.map((id) => {
        const category = getCategory(id);
        return (
          <Card key={id} className="p-3">
            <p className="mb-2 px-1 text-[13px] font-extrabold text-white/80">
              {category?.emoji} {category?.name}
            </p>
            <ul className="flex flex-col gap-1.5">
              {people.map((player) => {
                const check = checkAnswer(id, state.letter, answers[player.id]?.[id]);
                const text = (answers[player.id]?.[id] ?? "").trim();
                return (
                  <li
                    key={player.id}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-2xl px-2 py-1",
                      check.status === "unknown"
                        ? "bg-purple/20 ring-1 ring-purple/50"
                        : "bg-white/[0.05]",
                    )}
                  >
                    <PlayerAvatar player={player} size={28} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[16px] font-extrabold capitalize",
                          (check.status === "invalid" || check.status === "empty") &&
                            "text-white/40 line-through",
                        )}
                      >
                        {check.word ?? (text || "—")}
                      </span>
                      <span className="block truncate text-[11px] font-medium text-white/50">
                        {player.name}
                      </span>
                    </span>
                    {check.status === "valid" ? (
                      <Check className="size-5 shrink-0 text-aqua-light" strokeWidth={3} />
                    ) : check.status === "unknown" ? (
                      <VoteButtons room={room} playerId={player.id} categoryId={id} />
                    ) : (
                      <X className="size-5 shrink-0 text-white/35" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-night via-night/90 to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          {room.isHost ? (
            <PrimaryButton onClick={room.closeReview} className="h-14 w-full text-[17px]">
              Ver os pontos <span className="text-white/70">({seconds}s)</span>
            </PrimaryButton>
          ) : (
            <p className="py-3 text-center text-[14px] font-bold text-white/70">
              {playerName(room.players, room.hostId)} fecha a conferência · {seconds}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
