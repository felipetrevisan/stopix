import { describe, expect, test } from "bun:test";
import {
  DEFAULT_GIFT_AMOUNTS,
  DEFAULT_OPTIONS,
  GIFT_LIMITS,
  POINTS,
  type GameState,
  applyGift,
  boardAnswers,
  createGame,
  giftEffectFor,
  remainingMs,
  submitAnswer,
  tick,
  wordsFor,
} from "./index";

const rng = () => 0.3;
const player = (id: string) => ({ id, name: id });

const playing = (now = 0): GameState => ({
  ...createGame(now, DEFAULT_OPTIONS, rng),
  phase: "playing",
  phaseEndsAt: now + 30_000,
  round: { number: 1, categoryId: "frutas", letter: "G", answers: [] },
});

const gift = (state: GameState, effect: Parameters<typeof applyGift>[1], count = 1, now = 0) =>
  applyGift(state, effect, count, now, DEFAULT_OPTIONS, DEFAULT_GIFT_AMOUNTS, rng);

describe("presentes", () => {
  test("mais tempo soma por presente do combo, com teto", () => {
    const { state } = gift(playing(), "time", 5);
    expect(state.phaseEndsAt).toBe(30_000 + 5 * 3000);
    expect(state.round.gifts?.time).toBe(5);
    const capped = gift(playing(), "time", 500).state;
    expect(capped.phaseEndsAt).toBe(GIFT_LIMITS.maxRemainingMs);
  });

  test("congelar para o relógio e empurra o fim", () => {
    const { state } = gift(playing(), "freeze", 2, 1000);
    expect(state.round.frozenUntil).toBe(1000 + 10_000);
    expect(state.phaseEndsAt).toBe(30_000 + 10_000);
    // Durante o congelamento os segundos não andam.
    expect(remainingMs(state, 2000)).toBe(remainingMs(state, 9000));
    // Congelar de novo continua de onde parou.
    const again = gift(state, "freeze", 1, 2000).state;
    expect(again.round.frozenUntil).toBe(16_000);
  });

  test("troca a letra: novo quadro, pontos ficam, dá para responder de novo", () => {
    let state = submitAnswer(playing(), player("ana"), "goiaba", 1).state;
    state = gift(state, "letter", 3, 2).state;
    expect(state.round.letter).not.toBe("G");
    expect(state.round.categoryId).toBe("frutas");
    expect(boardAnswers(state.round)).toEqual([]);
    expect(state.scores.ana.points).toBe(POINTS.first);
    const word = wordsFor("frutas", state.round.letter)[0];
    const again = submitAnswer(state, player("ana"), word, 3);
    expect(again.outcome.type).toBe("accepted");
    expect(again.state.scores.ana.points).toBe(POINTS.first * 2);
  });

  test("troca a categoria e garante tempo para responder", () => {
    const late = { ...playing(), phaseEndsAt: 2000 };
    const { state } = gift(late, "category", 1, 1000);
    expect(state.round.categoryId).not.toBe("frutas");
    expect(state.phaseEndsAt).toBe(1000 + GIFT_LIMITS.minAfterSwapMs);
  });

  test("dobro de pontos vale para o resto da rodada", () => {
    let state = gift(playing(), "double").state;
    state = submitAnswer(state, player("ana"), "goiaba", 1).state;
    expect(state.scores.ana.points).toBe(POINTS.first * 2);
  });

  test("entre rodadas o presente espera e vale quando a próxima começa", () => {
    const options = DEFAULT_OPTIONS;
    let state = createGame(0, options, rng); // sorteando
    const queued = gift(state, "time", 2);
    expect(queued.result).toBe("queued");
    const start = state.phaseEndsAt;
    state = tick(queued.state, start, options, rng);
    expect(state.phase).toBe("playing");
    expect(state.pending).toEqual([]);
    expect(state.phaseEndsAt).toBe(start + options.roundSec * 1000 + 2 * 3000);
    expect(state.round.gifts?.time).toBe(2);
  });

  test("acha o efeito pelo nome do presente", () => {
    expect(giftEffectFor("rose", { time: "Rose" })).toBe("time");
    expect(giftEffectFor(" Galaxy ", { double: "galaxy" })).toBe("double");
    expect(giftEffectFor("Lion", { time: "Rose" })).toBeNull();
  });
});
