"use client";

import {
  DEFAULT_PARTY_SETTINGS,
  type PartySettings,
  type PartyState,
  type RoundAnswers,
  type RoundVotes,
  createPartyState,
  sanitizePartySettings,
} from "@stopix/game-core";
import { getFirebase } from "@/lib/firebase/client";
import { CODE_ALPHABET, CODE_LENGTH } from "./code";

export { CODE_LENGTH, isRoomCode, normalizeCode } from "./code";

// Sala no Realtime Database:
//   rooms/{code}/meta            { hostId, createdAt }        anfitrião (pode passar adiante)
//   rooms/{code}/settings        PartySettings                 só o anfitrião escreve
//   rooms/{code}/state           PartyState                    só o anfitrião escreve
//   rooms/{code}/players/{uid}   { name, avatar, joinedAt, online }
//   rooms/{code}/answers/{n}/{uid} { categoria: texto }        só durante a rodada n
//   rooms/{code}/votes/{n}/{jogador__categoria}/{uid} boolean  só na conferência
//   rooms/{code}/stop/{n}        uid de quem pediu STOP (o primeiro vale)

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  online: boolean;
};

export const AVATARS = [
  "🦊",
  "🐼",
  "🐸",
  "🦄",
  "🐙",
  "🐯",
  "🐨",
  "🐵",
  "🦉",
  "🐳",
  "🦖",
  "🐝",
  "🐧",
  "🦩",
  "🐢",
  "🐶",
];

const randomCode = () =>
  Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("");

/** O RTDB some com listas e objetos vazios: completa o estado que vem de lá. */
export const normalizeState = (
  raw: Partial<PartyState> | null,
  settings: PartySettings,
): PartyState => {
  const base = createPartyState(settings);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    categories: raw.categories ?? base.categories,
    usedLetters: raw.usedLetters ?? [],
    totals: raw.totals ?? {},
    results: raw.results ?? null,
    stoppedBy: raw.stoppedBy ?? null,
  };
};

export const normalizePlayers = (
  raw: Record<string, Omit<RoomPlayer, "id">> | null,
): RoomPlayer[] =>
  Object.entries(raw ?? {})
    .map(([id, player]) => ({
      id,
      name: player.name,
      avatar: player.avatar,
      joinedAt: player.joinedAt,
      online: player.online !== false,
    }))
    .sort((a, b) => a.joinedAt - b.joinedAt);

/** Tira undefined (o RTDB recusa) mantendo null. */
export const toDb = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type Profile = { name: string; avatar: string };

const PROFILE_KEY = "stopix:profile";
const SETTINGS_KEY = "stopix:room-settings";

export const readProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
};

export const saveProfile = (profile: Profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // sem localStorage
  }
};

export const readLastSettings = (): PartySettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return sanitizePartySettings(raw ? (JSON.parse(raw) as PartySettings) : DEFAULT_PARTY_SETTINGS);
  } catch {
    return DEFAULT_PARTY_SETTINGS;
  }
};

export const saveLastSettings = (settings: PartySettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // sem localStorage
  }
};

/** Cria a sala com um código livre e entra como anfitrião. */
export async function createRoom(profile: Profile): Promise<string> {
  const { db, uid } = await getFirebase();
  const { ref, runTransaction, serverTimestamp, set, update } = await import("firebase/database");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const result = await runTransaction(ref(db, `rooms/${code}/meta`), (current) =>
      current ? undefined : { hostId: uid, createdAt: Date.now() },
    );
    if (!result.committed) continue;
    const settings = readLastSettings();
    await update(ref(db, `rooms/${code}`), {
      settings,
      state: toDb(createPartyState(settings)),
    });
    await set(ref(db, `rooms/${code}/players/${uid}`), {
      ...profile,
      joinedAt: serverTimestamp(),
      online: true,
    });
    return code;
  }
  throw new Error("Não achei um código livre. Tente de novo.");
}

export type RoundData = { answers: RoundAnswers; votes: RoundVotes };
