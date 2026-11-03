import {
  CATEGORIES,
  DEFAULT_GIFT_AMOUNTS,
  DEFAULT_GIFT_NAMES,
  DEFAULT_OPTIONS,
  GIFT_EFFECTS,
  type GameOptions,
  type GiftAmounts,
  type GiftEffect,
} from "@stopix/game-core";

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
  /** Ondas e bolhas se mexendo no fundo (desligar ajuda a live com pouca internet). */
  waves: boolean;
  /** Esconde os botões de controle (prévia do painel). */
  preview: boolean;
  /** Presentes ligados a efeitos no jogo. */
  gifts: boolean;
  giftNames: Record<GiftEffect, string>;
  giftAmounts: GiftAmounts;
};

/** Nome curto de cada efeito no parâmetro da URL. */
const GIFT_PARAM: Record<GiftEffect, string> = {
  time: "gift_time",
  freeze: "gift_freeze",
  letter: "gift_letter",
  category: "gift_category",
  double: "gift_double",
};

export const DEFAULT_LIVE_SETTINGS: Omit<LiveSettings, "cid"> = {
  ...DEFAULT_OPTIONS,
  demo: false,
  admins: [],
  sound: true,
  volume: 60,
  background: "full",
  waves: true,
  preview: false,
  gifts: true,
  giftNames: DEFAULT_GIFT_NAMES,
  giftAmounts: DEFAULT_GIFT_AMOUNTS,
};

export const LIMITS = {
  roundSec: [10, 120],
  rounds: [1, 50],
  intermissionSec: [3, 30],
  timeSec: [1, 15],
  freezeSec: [2, 15],
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
  const categories = (search.get("categories") ?? "")
    .split(",")
    .filter((id) => CATEGORY_IDS.has(id));
  return {
    cid,
    roundSec: clamp(
      Number(search.get("round_time") ?? NaN),
      LIMITS.roundSec,
      DEFAULT_OPTIONS.roundSec,
    ),
    rounds: clamp(Number(search.get("rounds") ?? NaN), LIMITS.rounds, DEFAULT_OPTIONS.rounds),
    intermissionSec: clamp(
      Number(search.get("break") ?? NaN),
      LIMITS.intermissionSec,
      DEFAULT_OPTIONS.intermissionSec,
    ),
    categories,
    hardLetters: search.get("hard_letters") === "1",
    admins: (search.get("admins") ?? "").split(",").map(normalizeHandle).filter(Boolean),
    demo: cid === DEMO_CID || search.get("demo") === "1",
    sound: search.get("sound") !== "0",
    volume: clamp(Number(search.get("volume") ?? NaN), [0, 100], DEFAULT_LIVE_SETTINGS.volume),
    background: search.get("background") === "transparent" ? "transparent" : "full",
    waves: search.get("waves") !== "0",
    preview: search.get("preview") === "1",
    gifts: search.get("gifts") !== "0",
    giftNames: Object.fromEntries(
      GIFT_EFFECTS.map((effect) => [
        effect,
        (search.get(GIFT_PARAM[effect]) ?? DEFAULT_GIFT_NAMES[effect]).trim().slice(0, 40),
      ]),
    ) as Record<GiftEffect, string>,
    giftAmounts: {
      timeSec: clamp(
        Number(search.get("time_bonus") ?? NaN),
        LIMITS.timeSec,
        DEFAULT_GIFT_AMOUNTS.timeSec,
      ),
      freezeSec: clamp(
        Number(search.get("freeze_time") ?? NaN),
        LIMITS.freezeSec,
        DEFAULT_GIFT_AMOUNTS.freezeSec,
      ),
    },
  };
};

export const overlayPath = (settings: LiveSettings): string => {
  const params = new URLSearchParams();
  const defaults = DEFAULT_LIVE_SETTINGS;
  if (settings.roundSec !== defaults.roundSec) params.set("round_time", String(settings.roundSec));
  if (settings.rounds !== defaults.rounds) params.set("rounds", String(settings.rounds));
  if (settings.intermissionSec !== defaults.intermissionSec)
    params.set("break", String(settings.intermissionSec));
  if (settings.categories.length && settings.categories.length < CATEGORIES.length)
    params.set("categories", settings.categories.join(","));
  if (settings.hardLetters) params.set("hard_letters", "1");
  if (settings.admins.length) params.set("admins", settings.admins.join(","));
  if (settings.demo && settings.cid !== DEMO_CID) params.set("demo", "1");
  if (!settings.sound) params.set("sound", "0");
  else if (settings.volume !== defaults.volume) params.set("volume", String(settings.volume));
  if (settings.background === "transparent") params.set("background", "transparent");
  if (!settings.waves) params.set("waves", "0");
  if (settings.preview) params.set("preview", "1");
  if (!settings.gifts) params.set("gifts", "0");
  else {
    for (const effect of GIFT_EFFECTS) {
      if (settings.giftNames[effect] !== DEFAULT_GIFT_NAMES[effect])
        params.set(GIFT_PARAM[effect], settings.giftNames[effect]);
    }
    if (settings.giftAmounts.timeSec !== DEFAULT_GIFT_AMOUNTS.timeSec)
      params.set("time_bonus", String(settings.giftAmounts.timeSec));
    if (settings.giftAmounts.freezeSec !== DEFAULT_GIFT_AMOUNTS.freezeSec)
      params.set("freeze_time", String(settings.giftAmounts.freezeSec));
  }
  const query = params.toString();
  return `/live/${settings.cid}${query ? `?${query}` : ""}`;
};
