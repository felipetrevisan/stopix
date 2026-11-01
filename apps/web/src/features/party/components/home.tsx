"use client";

import { PARTY_POINTS } from "@stopix/game-core";
import { ArrowRight, Radio, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/features/live/components/brand-mark";
import { firebaseConfigured } from "@/lib/firebase/client";
import {
  AVATARS,
  CODE_LENGTH,
  type Profile,
  createRoom,
  isRoomCode,
  normalizeCode,
  readProfile,
  saveProfile,
} from "../room";
import { ProfileForm } from "./profile-form";
import { Card, Eyebrow, GhostButton, PrimaryButton } from "./ui";

const STEPS = [
  ["🔤", "Sai uma letra", "Todo mundo recebe a mesma letra e as mesmas categorias."],
  ["✍️", "Preencha rápido", "Nome, animal, fruta… tudo começando com a letra."],
  ["✋", "Grite STOP!", "Quem preencher tudo primeiro para a rodada de todo mundo."],
  ["🗳️", "Vote e pontue", "Palavra fora da lista vai para votação. A turma decide."],
] as const;

/** Página inicial: criar sala ou entrar com o código. */
export function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "", avatar: AVATARS[0] });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readProfile();
    setProfile(saved ?? { name: "", avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] });
  }, []);

  const named = profile.name.trim().length > 0;

  const create = async () => {
    if (!named) return;
    setBusy(true);
    setError(null);
    try {
      const clean = { ...profile, name: profile.name.trim() };
      saveProfile(clean);
      const room = await createRoom(clean);
      router.push(`/room/${room}`);
    } catch (cause) {
      console.error(cause);
      setError("Não deu para criar a sala. Confira a conexão e tente de novo.");
      setBusy(false);
    }
  };

  const enter = () => {
    if (!isRoomCode(code)) return;
    if (named) saveProfile({ ...profile, name: profile.name.trim() });
    router.push(`/room/${code}`);
  };

  return (
    <main className="stage-bg min-h-dvh bg-fixed">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pt-8 pb-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="flex items-center gap-2">
            <BrandMark size={56} className="drop-shadow-[0_4px_0_#120a3a]" />
            <span className="game-text text-[46px] text-white italic">Stopix</span>
          </span>
          <h1 className="game-text text-[27px] leading-tight text-white">
            O Stop (adedonha) para jogar online com os amigos
          </h1>
          <p className="text-[15px] text-white/70">
            Crie uma sala, mande o código e joguem cada um no seu celular.
          </p>
        </header>

        {firebaseConfigured ? null : (
          <p className="rounded-2xl bg-hot/20 px-4 py-3 text-[14px] font-bold text-white">
            As salas online estão indisponíveis no momento. Tente de novo daqui a pouco.
          </p>
        )}

        <Card className="flex flex-col gap-4">
          <ProfileForm profile={profile} onChange={setProfile} />
          <PrimaryButton onClick={create} disabled={!named || busy || !firebaseConfigured}>
            <Users className="size-5" /> {busy ? "Criando…" : "Criar sala"}
          </PrimaryButton>
          <div className="flex items-center gap-3 text-[12px] font-bold text-white/45 uppercase">
            <span className="h-px flex-1 bg-white/15" /> ou entre numa sala{" "}
            <span className="h-px flex-1 bg-white/15" />
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              enter();
            }}
          >
            <input
              value={code}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="CÓDIGO"
              aria-label="Código da sala"
              maxLength={CODE_LENGTH}
              autoCapitalize="characters"
              className="h-12 min-w-0 flex-1 rounded-2xl text-center text-[24px] font-black tracking-[0.4em] placeholder:text-[16px] placeholder:tracking-[0.2em] border-[3px] border-[#120a3a] bg-white text-[#120a3a] shadow-[inset_0_3px_0_rgb(18_10_58_/_0.12)] outline-none placeholder:text-[#120a3a]/35 focus-visible:ring-4 focus-visible:ring-aqua/60"
            />
            <GhostButton type="submit" disabled={!isRoomCode(code)} className="h-12 px-5">
              Entrar <ArrowRight className="size-4" />
            </GhostButton>
          </form>
          {error ? <p className="text-[13px] font-bold text-hot">{error}</p> : null}
        </Card>

        <Card>
          <Eyebrow>Como funciona</Eyebrow>
          <ol className="mt-3 grid grid-cols-2 gap-3">
            {STEPS.map(([icon, title, text]) => (
              <li key={title} className="card-light rounded-2xl p-3 text-[#120a3a]">
                <span className="text-[24px]">{icon}</span>
                <p className="mt-1 text-[15px] font-black">{title}</p>
                <p className="text-[13px] leading-snug font-semibold text-[#3b2f6b]">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-white/65">
            Pontos por resposta: <b className="text-white">{PARTY_POINTS.unique}</b> se só você
            respondeu aquilo, <b className="text-white">{PARTY_POINTS.repeated}</b> se repetiu,{" "}
            <b className="text-white">{PARTY_POINTS.alone}</b> se ninguém mais acertou a categoria.
          </p>
        </Card>

        <Link
          href="/live"
          className="chunky flex items-center gap-3 rounded-[24px] p-4 transition active:translate-y-[3px]"
        >
          <span className="chunky-pill flex size-11 items-center justify-center rounded-2xl">
            <Radio className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-extrabold">Vai jogar com o chat da live?</span>
            <span className="block text-[13px] text-white/65">
              Configure o overlay para TikTok LIVE Studio e OBS
            </span>
          </span>
          <ArrowRight className="size-5 text-aqua-light" />
        </Link>
      </div>
    </main>
  );
}
