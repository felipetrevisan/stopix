"use client";

import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/features/live/components/brand-mark";
import { AVATARS, type Profile, readProfile, saveProfile } from "../room";
import { type Room, useRoom } from "../use-room";
import { Lobby } from "./lobby";
import { PlaySheet } from "./play-sheet";
import { ProfileForm } from "./profile-form";
import { Review } from "./review";
import { Final, Scores } from "./scores";
import { Card, PrimaryButton } from "./ui";

function Message({ title, text }: { title: string; text: string }) {
  return (
    <Card className="mt-10 flex flex-col items-center gap-3 text-center">
      <p className="game-text text-[26px] text-white">{title}</p>
      <p className="text-[15px] text-white/70">{text}</p>
      <Link href="/" className="mt-2 text-[15px] font-bold text-aqua-light underline">
        Voltar para o início
      </Link>
    </Card>
  );
}

function JoinForm({ room, code }: { room: Room; code: string }) {
  const [profile, setProfile] = useState<Profile>({ name: "", avatar: AVATARS[0] });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setProfile(
      readProfile() ?? { name: "", avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] },
    );
  }, []);
  const join = async () => {
    const clean = { ...profile, name: profile.name.trim() };
    if (!clean.name) return;
    setBusy(true);
    saveProfile(clean);
    await room.join(clean).finally(() => setBusy(false));
  };
  return (
    <Card className="mt-6 flex flex-col gap-4">
      <p className="game-text text-[24px] text-white">
        Entrar na sala <span className="tracking-[0.15em] text-aqua-light">{code}</span>
      </p>
      <ProfileForm profile={profile} onChange={setProfile} />
      <PrimaryButton onClick={join} disabled={!profile.name.trim() || busy}>
        <LogIn className="size-5" /> Entrar
      </PrimaryButton>
    </Card>
  );
}

/** Página da sala: troca de tela conforme a fase. */
export function RoomScreen({ code }: { code: string }) {
  const room = useRoom(code);
  const autoJoined = useRef(false);

  // Quem já tem nome salvo entra direto (inclusive ao recarregar a página).
  useEffect(() => {
    if (room.status !== "ready" || room.joined || autoJoined.current) return;
    const profile = readProfile();
    if (!profile?.name) return;
    autoJoined.current = true;
    void room.join(profile);
  }, [room.status, room.joined, room.join]);

  let body: React.ReactNode;
  if (room.status === "not-configured") {
    body = (
      <Message
        title="Salas indisponíveis"
        text="As salas online estão indisponíveis no momento. Tente de novo daqui a pouco."
      />
    );
  } else if (room.status === "not-found") {
    body = (
      <Message
        title="Sala não encontrada"
        text={`Não existe sala com o código ${code}. Confira com quem te convidou.`}
      />
    );
  } else if (room.status === "error") {
    body = (
      <Message
        title="Sem conexão"
        text="Não deu para abrir a sala. Confira a internet e recarregue."
      />
    );
  } else if (room.status === "loading") {
    body = (
      <p className="mt-16 animate-pulse text-center text-[16px] font-bold text-white/70">
        Abrindo a sala…
      </p>
    );
  } else if (!room.joined) {
    body = <JoinForm room={room} code={code} />;
  } else {
    const { phase } = room.state;
    body =
      phase === "lobby" ? (
        <Lobby room={room} code={code} />
      ) : phase === "review" ? (
        <Review room={room} />
      ) : phase === "scores" ? (
        <Scores room={room} />
      ) : phase === "final" ? (
        <Final room={room} />
      ) : (
        <PlaySheet room={room} />
      );
  }

  return (
    <main className="stage-bg min-h-dvh bg-fixed">
      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <header className="mb-4 flex items-center justify-between">
          <Link href="/" aria-label="Início" className="flex items-center gap-1 text-white/70">
            <ArrowLeft className="size-5" />
            <BrandMark size={30} className="drop-shadow-[0_3px_0_#120a3a]" />
            <span className="game-text-sm text-[20px] text-white italic">Stopix</span>
          </Link>
          <span className="rounded-full border-2 border-[#120a3a] bg-white px-3 py-0.5 text-[14px] font-black tracking-[0.2em] text-[#120a3a] shadow-[0_2px_0_#120a3a]">
            {code}
          </span>
        </header>
        {body}
      </div>
    </main>
  );
}
