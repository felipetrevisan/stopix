import { getCategory } from "./categories";
import { answerKey, matchAnswer, wordsFor } from "./dictionary";
import type { Rng } from "./game";

// Modo amigos: o Stop clássico. Sorteia uma letra, cada um preenche todas as
// categorias, quem terminar pede STOP, a turma vota nas palavras que não estão nas
// listas e os pontos saem: 10 (só você), 5 (repetida), 20 (ninguém mais respondeu).
// Funções puras; quem guarda a sala (Firebase) e roda o relógio é o app do anfitrião.

export type PartyPhase =
  | "lobby"
  | "drawing"
  | "playing"
  | "stopping"
  | "review"
  | "scores"
  | "final";

export type PartySettings = {
  categories: string[];
  rounds: number;
  roundSec: number;
  hardLetters: boolean;
};

export const DEFAULT_PARTY_SETTINGS: PartySettings = {
  categories: ["names", "animals", "fruits", "countries", "colors", "objects"],
  rounds: 5,
  roundSec: 90,
  hardLetters: false,
};

export const PARTY_LIMITS = {
  categories: [3, 10],
  rounds: [1, 20],
  roundSec: [30, 300],
} as const;

/** Sorteio e STOP têm tempo fixo; conferência e placar avançam sozinhos se o anfitrião sumir. */
export const PARTY_TIMINGS = {
  drawMs: 3000,
  stoppingMs: 3000,
  reviewMs: 90_000,
  scoresMs: 45_000,
} as const;

export const PARTY_POINTS = { unique: 10, repeated: 5, alone: 20 } as const;

export type AnswerStatus = "valid" | "unknown" | "invalid" | "empty";

export type ReviewedAnswer = {
  text: string;
  /** Grafia da lista, quando a palavra está nela. */
  word?: string;
  status: AnswerStatus;
  accepted: boolean;
  points: number;
  /** "alone": só essa pessoa acertou a categoria. */
  kind?: "unique" | "repeated" | "alone";
  votes?: { yes: number; no: number };
};

export type PlayerRound = { total: number; answers: Record<string, ReviewedAnswer> };

export type RoundResults = {
  round: number;
  letter: string;
  stoppedBy: string | null;
  players: Record<string, PlayerRound>;
};

export type PartyState = {
  phase: PartyPhase;
  round: number;
  totalRounds: number;
  letter: string;
  categories: string[];
  /** Fim da fase atual (relógio do servidor). */
  endsAt: number;
  /** Quem pediu STOP (nulo: acabou o tempo). */
  stoppedBy: string | null;
  usedLetters: string[];
  totals: Record<string, number>;
  results: RoundResults | null;
};

/** Respostas de uma rodada: jogador → categoria → texto. */
export type RoundAnswers = Record<string, Record<string, string>>;

/** Votos de uma rodada: chave de voteKey → eleitor → aceita? */
export type RoundVotes = Record<string, Record<string, boolean>>;

export const voteKey = (playerId: string, categoryId: string) => `${playerId}__${categoryId}`;

const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const HARD_LETTERS = new Set(["K", "W", "Y", "X", "Z", "Q"]);

export const sanitizePartySettings = (value: Partial<PartySettings> | null | undefined) => {
  const clamp = (n: unknown, [min, max]: readonly [number, number], fallback: number) => {
    const number = Math.round(Number(n));
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  const categories = [...new Set((value?.categories ?? []).filter((id) => getCategory(id)))].slice(
    0,
    PARTY_LIMITS.categories[1],
  );
  return {
    categories:
      categories.length >= PARTY_LIMITS.categories[0]
        ? categories
        : DEFAULT_PARTY_SETTINGS.categories,
    rounds: clamp(value?.rounds, PARTY_LIMITS.rounds, DEFAULT_PARTY_SETTINGS.rounds),
    roundSec: clamp(value?.roundSec, PARTY_LIMITS.roundSec, DEFAULT_PARTY_SETTINGS.roundSec),
    hardLetters: Boolean(value?.hardLetters),
  } satisfies PartySettings;
};

/**
 * Letras jogáveis para um conjunto de categorias: pelo menos 60% delas precisam ter
 * duas palavras ou mais com a letra (senão a rodada vira um monte de casas vazias).
 */
export const partyLetters = (categories: readonly string[], hardLetters: boolean): string[] => {
  const needed = Math.ceil(categories.length * 0.6);
  return ALL_LETTERS.filter((letter) => {
    if (!hardLetters && HARD_LETTERS.has(letter)) return false;
    const covered = categories.filter((id) => wordsFor(id, letter).length >= 2).length;
    return covered >= needed;
  });
};

export const drawPartyLetter = (
  categories: readonly string[],
  used: readonly string[],
  hardLetters: boolean,
  rng: Rng,
): string => {
  const letters = partyLetters(categories, hardLetters);
  const fresh = letters.filter((letter) => !used.includes(letter));
  const pool = fresh.length ? fresh : letters.length ? letters : ["A", "B", "C", "M", "P", "S"];
  return pool[Math.floor(rng() * pool.length) % pool.length];
};

/** Confere uma resposta sozinha (sem votos nem repetição). */
export const checkAnswer = (
  categoryId: string,
  letter: string,
  text: string | undefined,
): { status: AnswerStatus; word?: string; key?: string } => {
  const raw = (text ?? "").trim();
  if (!raw) return { status: "empty" };
  const key = answerKey(raw);
  if (!key || key.charAt(0).toUpperCase() !== letter.toUpperCase()) return { status: "invalid" };
  const match = matchAnswer(categoryId, letter, raw);
  if (match) return { status: "valid", word: match.word, key: match.key };
  return { status: "unknown", key };
};

/** Palavra fora da lista vale, a não ser que a maioria dos outros vote contra. */
export const tallyVotes = (votes: Record<string, boolean> | undefined, authorId: string) => {
  let yes = 0;
  let no = 0;
  for (const [voter, accept] of Object.entries(votes ?? {})) {
    if (voter === authorId) continue;
    if (accept) yes += 1;
    else no += 1;
  }
  return { yes, no, accepted: no <= yes };
};

/** Pontos da rodada de todo mundo. */
export const reviewRound = (
  input: {
    round: number;
    letter: string;
    categories: readonly string[];
    stoppedBy: string | null;
    playerIds: readonly string[];
  },
  answers: RoundAnswers,
  votes: RoundVotes,
): RoundResults => {
  const { letter, categories, playerIds } = input;
  const players: Record<string, PlayerRound> = Object.fromEntries(
    playerIds.map((id) => [id, { total: 0, answers: {} }]),
  );
  for (const categoryId of categories) {
    const accepted: { playerId: string; key: string }[] = [];
    for (const playerId of playerIds) {
      const text = answers[playerId]?.[categoryId] ?? "";
      const check = checkAnswer(categoryId, letter, text);
      const reviewed: ReviewedAnswer = {
        text: text.trim(),
        status: check.status,
        accepted: check.status === "valid",
        points: 0,
      };
      if (check.word) reviewed.word = check.word;
      if (check.status === "unknown") {
        const tally = tallyVotes(votes[voteKey(playerId, categoryId)], playerId);
        reviewed.votes = { yes: tally.yes, no: tally.no };
        reviewed.accepted = tally.accepted;
      }
      if (reviewed.accepted && check.key) accepted.push({ playerId, key: check.key });
      players[playerId].answers[categoryId] = reviewed;
    }
    for (const { playerId, key } of accepted) {
      const same = accepted.filter((item) => item.key === key).length;
      const kind =
        accepted.length === 1 && playerIds.length > 1 ? "alone" : same > 1 ? "repeated" : "unique";
      const answer = players[playerId].answers[categoryId];
      answer.kind = kind;
      answer.points = PARTY_POINTS[kind];
      players[playerId].total += answer.points;
    }
  }
  return { round: input.round, letter, stoppedBy: input.stoppedBy, players };
};

/** Placar geral, do primeiro ao último. */
export const partyRanking = (totals: Record<string, number>) =>
  Object.entries(totals)
    .map(([playerId, points]) => ({ playerId, points }))
    .sort((a, b) => b.points - a.points);

export const createPartyState = (settings: PartySettings): PartyState => ({
  phase: "lobby",
  round: 0,
  totalRounds: settings.rounds,
  letter: "",
  categories: settings.categories,
  endsAt: 0,
  stoppedBy: null,
  usedLetters: [],
  totals: {},
  results: null,
});

const drawRound = (
  state: PartyState,
  settings: PartySettings,
  now: number,
  rng: Rng,
  round: number,
): PartyState => {
  const letter = drawPartyLetter(settings.categories, state.usedLetters, settings.hardLetters, rng);
  return {
    ...state,
    phase: "drawing",
    round,
    letter,
    categories: settings.categories,
    endsAt: now + PARTY_TIMINGS.drawMs,
    stoppedBy: null,
    usedLetters: [...state.usedLetters, letter],
  };
};

/** Anfitrião começa a partida (do saguão ou depois de uma partida). */
export const startParty = (settings: PartySettings, now: number, rng: Rng): PartyState =>
  drawRound({ ...createPartyState(settings), totalRounds: settings.rounds }, settings, now, rng, 1);

/** Alguém terminou e pediu STOP. */
export const requestStop = (state: PartyState, playerId: string, now: number): PartyState =>
  state.phase === "playing"
    ? { ...state, phase: "stopping", stoppedBy: playerId, endsAt: now + PARTY_TIMINGS.stoppingMs }
    : state;

export type ReviewInput = { answers: RoundAnswers; votes: RoundVotes; playerIds: string[] };

/** Fecha a conferência: calcula a rodada e soma no placar. */
export const finishReview = (state: PartyState, now: number, input: ReviewInput): PartyState => {
  if (state.phase !== "review") return state;
  const results = reviewRound(
    {
      round: state.round,
      letter: state.letter,
      categories: state.categories,
      stoppedBy: state.stoppedBy,
      playerIds: input.playerIds,
    },
    input.answers,
    input.votes,
  );
  const totals = { ...state.totals };
  for (const [playerId, player] of Object.entries(results.players)) {
    totals[playerId] = (totals[playerId] ?? 0) + player.total;
  }
  return { ...state, phase: "scores", results, totals, endsAt: now + PARTY_TIMINGS.scoresMs };
};

/** Do placar da rodada para a próxima letra (ou para o fim da partida). */
export const nextPartyRound = (
  state: PartyState,
  settings: PartySettings,
  now: number,
  rng: Rng,
): PartyState => {
  if (state.phase !== "scores") return state;
  if (state.round >= state.totalRounds) return { ...state, phase: "final", endsAt: 0 };
  return drawRound(state, settings, now, rng, state.round + 1);
};

/** Avança as fases com tempo. Devolve o mesmo objeto se nada mudou. */
export const partyTick = (
  state: PartyState,
  settings: PartySettings,
  now: number,
  rng: Rng,
  input: ReviewInput,
): PartyState => {
  if (state.phase === "lobby" || state.phase === "final" || now < state.endsAt) return state;
  switch (state.phase) {
    case "drawing":
      return { ...state, phase: "playing", endsAt: now + settings.roundSec * 1000 };
    case "playing":
      return {
        ...state,
        phase: "stopping",
        stoppedBy: null,
        endsAt: now + PARTY_TIMINGS.stoppingMs,
      };
    case "stopping":
      return { ...state, phase: "review", endsAt: now + PARTY_TIMINGS.reviewMs };
    case "review":
      return finishReview(state, now, input);
    case "scores":
      return nextPartyRound(state, settings, now, rng);
  }
};
