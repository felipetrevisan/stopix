import { CATEGORIES, getCategory } from "./categories";
import { lettersWith, matchAnswer, wordsFor } from "./dictionary";

// Motor do Stopix: funções puras sobre o estado da partida. Quem lê o chat, guarda o
// estado e chama `tick` de tempos em tempos é o app (overlay no navegador da live).

export type Player = { id: string; name: string; avatar?: string };

/** first: primeira resposta certa da rodada; new: palavra que ninguém tinha mandado. */
export type AnswerKind = "first" | "new" | "repeated";

export type Answer = {
  player: Player;
  word: string;
  key: string;
  kind: AnswerKind;
  points: number;
  at: number;
};

export type Phase = "drawing" | "playing" | "stop" | "results" | "intermission" | "final";

export type RoundPlace = { player: Player; word: string; points: number };

export type RoundSummary = { podium: RoundPlace[]; alsoValid: string[]; answered: number };

export type RoundState = {
  number: number;
  categoryId: string;
  letter: string;
  /** Respostas certas, na ordem em que chegaram. */
  answers: Answer[];
  summary?: RoundSummary;
};

export type ScoreEntry = { player: Player; points: number; correct: number; updatedAt: number };

export type GameState = {
  version: 1;
  /** Número da partida (cada partida tem `totalRounds` rodadas). */
  game: number;
  phase: Phase;
  phaseEndsAt: number;
  totalRounds: number;
  round: RoundState;
  scores: Record<string, ScoreEntry>;
  /** Categoria:letra já sorteadas nesta partida. */
  used: string[];
};

export type GameOptions = {
  roundSec: number;
  rounds: number;
  intermissionSec: number;
  /** Ids das categorias sorteadas; vazio = todas. */
  categories: readonly string[];
  /** Sorteia também K, W, Y, X, Z e Q (quando a categoria tem palavras). */
  hardLetters: boolean;
};

export const DEFAULT_OPTIONS: GameOptions = {
  roundSec: 30,
  rounds: 10,
  intermissionSec: 6,
  categories: [],
  hardLetters: false,
};

export const POINTS = { first: 150, new: 100, repeated: 50 } as const;

export const TIMINGS = { drawMs: 3200, stopMs: 3600, resultsMs: 7500, finalMs: 12000 } as const;

/** Uma letra só entra no sorteio se a categoria tiver pelo menos isso de palavras. */
export const MIN_WORDS_PER_LETTER = 5;
const HARD_LETTERS = new Set(["K", "W", "Y", "X", "Z", "Q"]);

export type Rng = () => number;

const pick = <T>(list: readonly T[], rng: Rng): T =>
  list[Math.floor(rng() * list.length) % list.length];

const shuffle = <T>(list: readonly T[], rng: Rng): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const categoryPool = (options: GameOptions) => {
  const chosen = options.categories.filter((id) => getCategory(id));
  return chosen.length ? chosen : CATEGORIES.map((category) => category.id);
};

const playableLetters = (categoryId: string, options: GameOptions) =>
  lettersWith(categoryId, MIN_WORDS_PER_LETTER).filter(
    (letter) => options.hardLetters || !HARD_LETTERS.has(letter),
  );

/** Sorteia categoria e letra, sem repetir combinação na partida nem a letra anterior. */
export const drawRound = (
  number: number,
  used: readonly string[],
  previous: { categoryId: string; letter: string } | null,
  options: GameOptions,
  rng: Rng,
): RoundState => {
  const pool = categoryPool(options);
  const candidates = pool.map((categoryId) => ({
    categoryId,
    letters: playableLetters(categoryId, options).filter(
      (letter) => !used.includes(`${categoryId}:${letter}`) && letter !== previous?.letter,
    ),
  }));
  let available = candidates.filter((item) => item.letters.length > 0);
  // Evita a mesma categoria duas vezes seguidas quando dá.
  const fresh = available.filter((item) => item.categoryId !== previous?.categoryId);
  if (fresh.length) available = fresh;
  if (!available.length) {
    // Tudo sorteado (partida enorme): libera repetir combinação.
    const categoryId = pick(pool, rng);
    const letters = playableLetters(categoryId, options);
    return { number, categoryId, letter: pick(letters.length ? letters : ["A"], rng), answers: [] };
  }
  const choice = pick(available, rng);
  return { number, categoryId: choice.categoryId, letter: pick(choice.letters, rng), answers: [] };
};

const clampRounds = (rounds: number) => Math.min(50, Math.max(1, Math.round(rounds) || 1));

export const createGame = (now: number, options: GameOptions, rng: Rng, game = 1): GameState => {
  const round = drawRound(1, [], null, options, rng);
  return {
    version: 1,
    game,
    phase: "drawing",
    phaseEndsAt: now + TIMINGS.drawMs,
    totalRounds: clampRounds(options.rounds),
    round,
    scores: {},
    used: [`${round.categoryId}:${round.letter}`],
  };
};

/** Placar da partida, do primeiro ao último (empate: quem chegou antes nos pontos). */
export const ranking = (scores: Record<string, ScoreEntry>): ScoreEntry[] =>
  Object.values(scores).sort((a, b) => b.points - a.points || a.updatedAt - b.updatedAt);

export const summarizeRound = (round: RoundState, rng: Rng): RoundSummary => {
  const podium = [...round.answers]
    .sort((a, b) => b.points - a.points || a.at - b.at)
    .slice(0, 3)
    .map(({ player, word, points }) => ({ player, word, points }));
  const said = new Set(round.answers.map((answer) => answer.word));
  const unsaid = wordsFor(round.categoryId, round.letter).filter((word) => !said.has(word));
  return { podium, alsoValid: shuffle(unsaid, rng).slice(0, 4), answered: round.answers.length };
};

const nextRound = (
  state: GameState,
  now: number,
  options: GameOptions,
  rng: Rng,
  number: number,
) => {
  const round = drawRound(number, state.used, state.round, options, rng);
  return {
    ...state,
    phase: "drawing" as const,
    phaseEndsAt: now + TIMINGS.drawMs,
    round,
    used: [...state.used, `${round.categoryId}:${round.letter}`],
  };
};

/** Avança uma fase quando o tempo dela acaba. Devolve o mesmo objeto se nada mudou. */
export const tick = (state: GameState, now: number, options: GameOptions, rng: Rng): GameState => {
  if (now < state.phaseEndsAt) return state;
  switch (state.phase) {
    case "drawing":
      return { ...state, phase: "playing", phaseEndsAt: now + options.roundSec * 1000 };
    case "playing":
      return { ...state, phase: "stop", phaseEndsAt: now + TIMINGS.stopMs };
    case "stop":
      return {
        ...state,
        phase: "results",
        phaseEndsAt: now + TIMINGS.resultsMs,
        round: { ...state.round, summary: summarizeRound(state.round, rng) },
      };
    case "results":
      return state.round.number >= state.totalRounds
        ? { ...state, phase: "final", phaseEndsAt: now + TIMINGS.finalMs }
        : { ...state, phase: "intermission", phaseEndsAt: now + options.intermissionSec * 1000 };
    case "intermission":
      return nextRound(state, now, options, rng, state.round.number + 1);
    case "final":
      return createGame(now, options, rng, state.game + 1);
  }
};

export type Overtake = { player: Player; passed: Player; position: number };

export type AnswerOutcome =
  | { type: "accepted"; answer: Answer; overtake?: Overtake }
  | { type: "invalid" | "already" | "ignored" };

/** Posições do placar que valem alerta de ultrapassagem (1º ao 5º). */
export const OVERTAKE_TOP = 5;

/** Resposta de alguém do chat. Cada pessoa vale uma resposta certa por rodada. */
export const submitAnswer = (
  state: GameState,
  player: Player,
  text: string,
  now: number,
): { state: GameState; outcome: AnswerOutcome } => {
  if (state.phase !== "playing" || now > state.phaseEndsAt) {
    return { state, outcome: { type: "ignored" } };
  }
  const { round } = state;
  if (round.answers.some((answer) => answer.player.id === player.id)) {
    return { state, outcome: { type: "already" } };
  }
  const match = matchAnswer(round.categoryId, round.letter, text);
  if (!match) return { state, outcome: { type: "invalid" } };

  const repeated = round.answers.some((answer) => answer.key === match.key);
  const kind: AnswerKind = round.answers.length === 0 ? "first" : repeated ? "repeated" : "new";
  const answer: Answer = { player, ...match, kind, points: POINTS[kind], at: now };

  const before = ranking(state.scores).map((entry) => entry.player.id);
  const previous = state.scores[player.id];
  const scores = {
    ...state.scores,
    [player.id]: {
      player,
      points: (previous?.points ?? 0) + answer.points,
      correct: (previous?.correct ?? 0) + 1,
      updatedAt: now,
    },
  };
  const after = ranking(scores);
  const position = after.findIndex((entry) => entry.player.id === player.id);
  const was = before.indexOf(player.id);
  const passed = after[position + 1]?.player;
  const overtake =
    passed && position < OVERTAKE_TOP && (was === -1 ? before.length > position : was > position)
      ? { player, passed, position: position + 1 }
      : undefined;

  return {
    state: { ...state, scores, round: { ...round, answers: [...round.answers, answer] } },
    outcome: { type: "accepted", answer, overtake },
  };
};

/** "STOP!" antes do tempo (comando do moderador). */
export const forceStop = (state: GameState, now: number): GameState =>
  state.phase === "playing"
    ? { ...state, phase: "stop", phaseEndsAt: now + TIMINGS.stopMs }
    : state;

/**
 * Pular: na rodada (sorteio ou valendo), troca categoria e letra e devolve os pontos
 * dela; nas telas entre rodadas, só adianta para a próxima.
 */
export const skip = (state: GameState, now: number, options: GameOptions, rng: Rng): GameState => {
  if (state.phase !== "drawing" && state.phase !== "playing") {
    return tick({ ...state, phaseEndsAt: now }, now, options, rng);
  }
  const scores = { ...state.scores };
  for (const answer of state.round.answers) {
    const entry = scores[answer.player.id];
    if (!entry) continue;
    const points = entry.points - answer.points;
    const correct = entry.correct - 1;
    if (points <= 0 && correct <= 0) delete scores[answer.player.id];
    else scores[answer.player.id] = { ...entry, points, correct };
  }
  return nextRound({ ...state, scores }, now, options, rng, state.round.number);
};

/** Retoma um estado salvo (o OBS recarrega a fonte às vezes); nulo se não serve. */
export const restoreGame = (value: unknown): GameState | null => {
  const state = value as GameState | null;
  if (!state || state.version !== 1 || !state.round || !getCategory(state.round.categoryId)) {
    return null;
  }
  return state;
};
