"use client";

import { CATEGORIES, PARTY_LIMITS, type PartySettings } from "@stopix/game-core";
import { Check, Crown, Link2, Minus, Play, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Room } from "../use-room";
import { Card, Eyebrow, GhostButton, PlayerAvatar, PrimaryButton, playerName } from "./ui";

const TIMES = [60, 90, 120, 180, 240];

function Stepper({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  const button =
    "flex size-9 items-center justify-center rounded-xl border-[2.5px] border-[#120a3a] bg-white text-[#120a3a] shadow-[0_2px_0_#120a3a] disabled:opacity-30";
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className={button}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Menos"
      >
        <Minus className="size-4" />
      </button>
      <span className="game-text-sm w-8 text-center text-[22px] text-white tabular-nums">
        {value}
      </span>
      <button
        type="button"
        className={button}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Mais"
      >
        <Plus className="size-4" />
      </button>
    </span>
  );
}

function Invite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/room/${code}`;
  const share = async () => {
    const text = `Bora jogar Stop? Entra na minha sala do Stopix: ${url}`;
    if (navigator.share) {
      await navigator.share({ title: "Stopix", text, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card className="flex items-center gap-4">
      <div className="flex-1">
        <Eyebrow>Código da sala</Eyebrow>
        <p className="game-text text-[48px] leading-none tracking-[0.16em] text-aqua-light">
          {code}
        </p>
      </div>
      <GhostButton onClick={share} className="shrink-0">
        {copied ? (
          <Check className="size-4" />
        ) : typeof navigator !== "undefined" && "share" in navigator ? (
          <Share2 className="size-4" />
        ) : (
          <Link2 className="size-4" />
        )}
        {copied ? "Copiado" : "Convidar"}
      </GhostButton>
    </Card>
  );
}

/** Saguão: quem já entrou, as regras da partida e o botão de começar. */
export function Lobby({ room, code }: { room: Room; code: string }) {
  const { settings, isHost, players, hostId, me } = room;
  const update = (patch: Partial<PartySettings>) => room.updateSettings({ ...settings, ...patch });
  const toggleCategory = (id: string) => {
    const has = settings.categories.includes(id);
    if (has && settings.categories.length <= PARTY_LIMITS.categories[0]) return;
    if (!has && settings.categories.length >= PARTY_LIMITS.categories[1]) return;
    update({
      categories: has
        ? settings.categories.filter((item) => item !== id)
        : CATEGORIES.map((category) => category.id).filter(
            (item) => item === id || settings.categories.includes(item),
          ),
    });
  };
  const online = players.filter((player) => player.online);

  return (
    <div className="flex flex-col gap-4">
      <Invite code={code} />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Eyebrow>Na sala</Eyebrow>
          <span className="text-[12px] font-bold text-white/55">{online.length} online</span>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {players.map((player) => (
            <li
              key={player.id}
              className={cn(
                "card-light flex items-center gap-2 rounded-2xl px-2 py-1.5 text-[#120a3a]",
                player.id === me && "card-first",
              )}
            >
              <PlayerAvatar player={player} size={34} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
                {player.name}
                {player.id === me ? <span className="text-[#120a3a]/50"> (você)</span> : null}
              </span>
              {player.id === hostId ? (
                <Crown className="size-4 shrink-0 text-purple" strokeWidth={3} />
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Eyebrow>Categorias</Eyebrow>
          <span className="text-[12px] font-bold text-white/55">
            {settings.categories.length}/{PARTY_LIMITS.categories[1]}
          </span>
        </div>
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const on = settings.categories.includes(category.id);
            if (!isHost && !on) return null;
            return (
              <button
                key={category.id}
                type="button"
                disabled={!isHost}
                onClick={() => toggleCategory(category.id)}
                aria-pressed={on}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-bold transition",
                  on
                    ? "border-[2.5px] border-[#120a3a] bg-aqua text-[#120a3a] shadow-[0_2px_0_#120a3a]"
                    : "border-2 border-white/20 bg-[#120a3a]/40 text-white/60",
                  isHost && "active:scale-95",
                )}
              >
                {category.emoji} {category.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <span className="game-text-sm text-[15px] text-white">Rodadas</span>
          <Stepper
            value={settings.rounds}
            min={PARTY_LIMITS.rounds[0]}
            max={PARTY_LIMITS.rounds[1]}
            disabled={!isHost}
            onChange={(rounds) => update({ rounds })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="game-text-sm text-[15px] text-white">Tempo por rodada</span>
          <div className="flex gap-1.5">
            {TIMES.map((sec) => (
              <button
                key={sec}
                type="button"
                disabled={!isHost}
                onClick={() => update({ roundSec: sec })}
                className={cn(
                  "h-9 flex-1 rounded-xl text-[13px] font-bold transition",
                  settings.roundSec === sec
                    ? "border-[2.5px] border-[#120a3a] bg-aqua text-[#120a3a] shadow-[0_2px_0_#120a3a]"
                    : "border-2 border-white/20 bg-[#120a3a]/40 text-white/60",
                )}
              >
                {sec >= 60 && sec % 60 === 0
                  ? `${sec / 60} min`
                  : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}
              </button>
            ))}
          </div>
        </div>
        <label
          className={cn("flex items-center gap-3 text-[14px] font-bold", !isHost && "opacity-60")}
        >
          <input
            type="checkbox"
            checked={settings.hardLetters}
            disabled={!isHost}
            onChange={() => update({ hardLetters: !settings.hardLetters })}
            className="size-5 accent-teal-400"
          />
          Valer letras difíceis (K, W, Y, X, Z, Q)
        </label>
      </Card>

      {isHost ? (
        <PrimaryButton onClick={room.start} className="h-14 text-[18px]">
          <Play className="size-5 fill-white" /> Começar partida
        </PrimaryButton>
      ) : (
        <p className="py-3 text-center text-[15px] font-bold text-white/70">
          Esperando {playerName(players, hostId)} começar…
        </p>
      )}
      {isHost && online.length < 2 ? (
        <p className="-mt-2 text-center text-[13px] text-white/55">
          Dá para jogar sozinho para treinar, mas é melhor com a turma: mande o código!
        </p>
      ) : null}
    </div>
  );
}
