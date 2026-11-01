import { CATEGORIES, DEFAULT_OPTIONS, type GameOptions } from "@stopix/game-core";

// Opções do overlay: vão na URL (a fonte de navegador do LIVE Studio/OBS não tem login).

export const DEMO_CID = "demo";

export type Background = "full" | "transparent";

export type LiveSettings = GameOptions & {
  cid: string;
  demo: boolean;
  admins: string[];
  sound: boolean;
  volume: number;
  background: Background;
  /** Esconde os botões de controle (prévia do painel). */
  preview: boolean;
};

export const DEFAULT_LIVE_SETTINGS: Omit<LiveSettings, "cid"> = {
  ...DEFAULT_OPTIONS,
  demo: false,
  admins: [],
  sound: true,
  volume: 60,
  background: "full",
  preview: false,
};

export const LIMITS = {
  roundSec: [10, 120],
  rounds: [1, 50],
  intermissionSec: [3, 30],
} as const;

const clamp = (value: number, [min, max]: readonly [number, number], fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

export const normalizeHandle = (handle: string) => handle.trim().replace(/^@/, "").toLowerCase();

/** Aceita o código do canal ou qualquer link de overlay do Neon (…/overlay/{código}/alerts). */
export const extractChannelId = (input: string): string | null => {
  const text = input.trim();
  const fromUrl = /\/overlay\/([A-Za-z0-9_-]{20,})/.exec(text)?.[1];
  const id = fromUrl ?? text;
  return /^[A-Za-z0-9_-]{20,64}$/.test(id) ? id : null;
};

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));

export const settingsFromSearch = (cid: string, search: URLSearchParams): LiveSettings => {
  const categories = (search.get("categorias") ?? "")
    .split(",")
    .filter((id) => CATEGORY_IDS.has(id));
  return {
    cid,
    roundSec: clamp(Number(search.get("tempo") ?? NaN), LIMITS.roundSec, DEFAULT_OPTIONS.roundSec),
    rounds: clamp(Number(search.get("rodadas") ?? NaN), LIMITS.rounds, DEFAULT_OPTIONS.rounds),
    intermissionSec: clamp(
      Number(search.get("intervalo") ?? NaN),
      LIMITS.intermissionSec,
      DEFAULT_OPTIONS.intermissionSec,
    ),
    categories,
    hardLetters: search.get("dificeis") === "1",
    admins: (search.get("admins") ?? "").split(",").map(normalizeHandle).filter(Boolean),
    demo: cid === DEMO_CID || search.get("demo") === "1",
    sound: search.get("som") !== "0",
    volume: clamp(Number(search.get("volume") ?? NaN), [0, 100], DEFAULT_LIVE_SETTINGS.volume),
    background: search.get("fundo") === "transparente" ? "transparent" : "full",
    preview: search.get("previa") === "1",
  };
};

export const overlayPath = (settings: LiveSettings): string => {
  const params = new URLSearchParams();
  const defaults = DEFAULT_LIVE_SETTINGS;
  if (settings.roundSec !== defaults.roundSec) params.set("tempo", String(settings.roundSec));
  if (settings.rounds !== defaults.rounds) params.set("rodadas", String(settings.rounds));
  if (settings.intermissionSec !== defaults.intermissionSec)
    params.set("intervalo", String(settings.intermissionSec));
  if (settings.categories.length && settings.categories.length < CATEGORIES.length)
    params.set("categorias", settings.categories.join(","));
  if (settings.hardLetters) params.set("dificeis", "1");
  if (settings.admins.length) params.set("admins", settings.admins.join(","));
  if (settings.demo && settings.cid !== DEMO_CID) params.set("demo", "1");
  if (!settings.sound) params.set("som", "0");
  else if (settings.volume !== defaults.volume) params.set("volume", String(settings.volume));
  if (settings.background === "transparent") params.set("fundo", "transparente");
  if (settings.preview) params.set("previa", "1");
  const query = params.toString();
  return `/live/${settings.cid}${query ? `?${query}` : ""}`;
};
