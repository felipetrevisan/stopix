import { getCategory } from "./categories";
import { type GameOptions, type GameState, type Rng, drawRound, playableLetters } from "./game";

// Presentes da live mexendo no jogo: o streamer liga cada efeito a um presente do
// TikTok (pelo nome) no painel. Funções puras, como o resto do motor.

export type GiftEffect = "time" | "freeze" | "letter" | "category" | "double";

export const GIFT_EFFECTS: readonly GiftEffect[] = [
  "time",
  "freeze",
  "letter",
  "category",
  "double",
];

export type GiftAmounts = { timeSec: number; freezeSec: number };

export const DEFAULT_GIFT_AMOUNTS: GiftAmounts = { timeSec: 3, freezeSec: 5 };

/** Presentes padrão (nomes como o TikTok manda). O streamer troca no painel. */
export const DEFAULT_GIFT_NAMES: Record<GiftEffect, string> = {
  time: "Rose",
  freeze: "Perfume",
  letter: "Doughnut",
  category: "Hand Hearts",
  double: "Galaxy",
};

export const GIFT_LIMITS = {
  /** O relógio não passa disso com "mais tempo". */
  maxRemainingMs: 120_000,
  /** Congelado no máximo isso de uma vez. */
  maxFreezeMs: 30_000,
  /** Depois de trocar letra/categoria, sobra pelo menos isso para responder. */
  minAfterSwapMs: 15_000,
  maxPending: 30,
} as const;

export type PendingGift = { effect: GiftEffect; count: number; by?: string };

export type GiftResult = "applied" | "queued";

const countGift = (state: GameState, effect: GiftEffect, count: number): GameState => ({
  ...state,
  round: {
    ...state.round,
    gifts: { ...state.round.gifts, [effect]: (state.round.gifts?.[effect] ?? 0) + count },
  },
});

const keepTimeAfterSwap = (state: GameState, now: number): GameState => {
  if (state.phase !== "playing") return state;
  const frozen = Math.max(now, state.round.frozenUntil ?? 0);
  return {
    ...state,
    phaseEndsAt: Math.max(state.phaseEndsAt, frozen + GIFT_LIMITS.minAfterSwapMs),
  };
};

const swapLetter = (state: GameState, options: GameOptions, rng: Rng): GameState => {
  const { round } = state;
  const letters = playableLetters(round.categoryId, options).filter(
    (letter) => letter !== round.letter && !state.used.includes(`${round.categoryId}:${letter}`),
  );
  const pool = letters.length
    ? letters
    : playableLetters(round.categoryId, options).filter((letter) => letter !== round.letter);
  if (!pool.length) return state;
  const letter = pool[Math.floor(rng() * pool.length) % pool.length];
  return {
    ...state,
    round: { ...round, letter },
    used: [...state.used, `${round.categoryId}:${letter}`],
  };
};

const swapCategory = (state: GameState, options: GameOptions, rng: Rng): GameState => {
  const { round } = state;
  const next = drawRound(round.number, state.used, round, options, rng);
  if (!getCategory(next.categoryId)) return state;
  return {
    ...state,
    round: { ...round, categoryId: next.categoryId, letter: next.letter },
    used: [...state.used, `${next.categoryId}:${next.letter}`],
  };
};

/**
 * Aplica o efeito de um presente. Valendo, vale na hora; no sorteio, troca de letra e
 * categoria valem na hora e o resto espera; entre rodadas, tudo espera a próxima.
 * `count` é quantos presentes chegaram (combo do TikTok).
 */
export const applyGift = (
  state: GameState,
  effect: GiftEffect,
  count: number,
  now: number,
  options: GameOptions,
  amounts: GiftAmounts,
  rng: Rng,
): { state: GameState; result: GiftResult } => {
  const units = Math.max(1, Math.floor(count));
  const swap = effect === "letter" || effect === "category";
  const immediate = state.phase === "playing" || (swap && state.phase === "drawing");
  if (!immediate) {
    const pending = [...(state.pending ?? []), { effect, count: units }].slice(
      -GIFT_LIMITS.maxPending,
    );
    return { state: { ...state, pending }, result: "queued" };
  }

  let next = countGift(state, effect, units);
  const { round } = next;
  switch (effect) {
    case "time": {
      const frozen = Math.max(now, round.frozenUntil ?? 0);
      const cap = frozen + GIFT_LIMITS.maxRemainingMs;
      next = {
        ...next,
        phaseEndsAt: Math.min(cap, next.phaseEndsAt + units * amounts.timeSec * 1000),
      };
      break;
    }
    case "freeze": {
      const start = Math.max(now, round.frozenUntil ?? 0);
      const end = Math.min(now + GIFT_LIMITS.maxFreezeMs, start + units * amounts.freezeSec * 1000);
      const added = Math.max(0, end - start);
      next = {
        ...next,
        phaseEndsAt: next.phaseEndsAt + added,
        round: { ...round, frozenUntil: Math.max(round.frozenUntil ?? 0, end) },
      };
      break;
    }
    case "letter":
      // Um combo de 5 donuts troca a letra uma vez só (cinco trocas seguidas não dão para ver).
      next = keepTimeAfterSwap(swapLetter(next, options, rng), now);
      break;
    case "category":
      next = keepTimeAfterSwap(swapCategory(next, options, rng), now);
      break;
    case "double":
      next = { ...next, round: { ...round, multiplier: 2 } };
      break;
  }
  return { state: next, result: "applied" };
};

/** Presentes que esperavam a rodada: valem quando ela começa. */
export const applyPending = (
  state: GameState,
  now: number,
  options: GameOptions,
  rng: Rng,
  amounts: GiftAmounts = DEFAULT_GIFT_AMOUNTS,
): GameState => {
  if (!state.pending?.length) return state;
  let next: GameState = { ...state, pending: [] };
  for (const gift of state.pending) {
    next = applyGift(next, gift.effect, gift.count, now, options, amounts, rng).state;
  }
  return next;
};

/** Nome do presente → efeito, ignorando maiúsculas e espaços. */
export const giftEffectFor = (
  name: string | undefined,
  mapping: Partial<Record<GiftEffect, string>>,
): GiftEffect | null => {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return null;
  for (const effect of GIFT_EFFECTS) {
    if ((mapping[effect] ?? "").trim().toLowerCase() === key) return effect;
  }
  return null;
};
