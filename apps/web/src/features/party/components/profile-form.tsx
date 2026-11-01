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
        <span className="game-text-sm text-[15px] text-white">Seu nome</span>
        <input
          value={profile.name}
          onChange={(event) => onChange({ ...profile, name: event.target.value.slice(0, 20) })}
          placeholder="Como a turma te chama?"
          maxLength={20}
          autoComplete="nickname"
          className="h-12 rounded-2xl px-4 text-[17px] font-black placeholder:font-semibold border-[3px] border-[#120a3a] bg-white text-[#120a3a] shadow-[inset_0_3px_0_rgb(18_10_58_/_0.12)] outline-none placeholder:text-[#120a3a]/35 focus-visible:ring-4 focus-visible:ring-aqua/60"
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
                ? "border-[2.5px] border-[#120a3a] bg-aqua text-[#120a3a] shadow-[0_2px_0_#120a3a] scale-110"
                : "border-2 border-transparent bg-[#120a3a]/40 hover:bg-[#120a3a]/60",
            )}
          >
            {avatar}
          </button>
        ))}
      </div>
    </div>
  );
}
