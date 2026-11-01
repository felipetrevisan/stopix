"use client";

import { cn } from "@/lib/utils";
import { AVATARS, type Profile } from "../room";

/** Nome e bichinho do jogador. */
export function ProfileForm({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-white/80">Seu nome</span>
        <input
          value={profile.name}
          onChange={(event) => onChange({ ...profile, name: event.target.value.slice(0, 20) })}
          placeholder="Como a turma te chama?"
          maxLength={20}
          autoComplete="nickname"
          className="h-12 rounded-2xl border border-white/15 bg-night/60 px-4 text-[17px] font-bold outline-none placeholder:font-medium placeholder:text-white/35 focus-visible:border-aqua focus-visible:ring-2 focus-visible:ring-aqua/40"
        />
      </label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Avatar">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            role="radio"
            aria-checked={profile.avatar === avatar}
            onClick={() => onChange({ ...profile, avatar })}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl text-[22px] transition",
              profile.avatar === avatar
                ? "bg-aqua/25 ring-2 ring-aqua"
                : "bg-white/5 hover:bg-white/10",
            )}
          >
            {avatar}
          </button>
        ))}
      </div>
    </div>
  );
}
