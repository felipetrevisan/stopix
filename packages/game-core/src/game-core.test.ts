import { describe, expect, test } from "bun:test";
import {
  CATEGORIES,
  DEFAULT_OPTIONS,
  MIN_WORDS_PER_LETTER,
  POINTS,
  TIMINGS,
  type GameState,
  createGame,
  drawRound,
  forceStop,
  lettersWith,
  matchAnswer,
  normalizeKey,
  parseCommand,
  ranking,
  restoreGame,
  skip,
  submitAnswer,
  tick,
  wordsFor,
} from "./index";

const seeded = (seed = 1) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const player = (id: string) => ({ id, name: id });

/** Partida já valendo, com categoria e letra escolhidas. */
const playing = (categoryId: string, letter: string, now = 0): GameState => ({
  ...createGame(now, DEFAULT_OPTIONS, seeded()),
  phase: "playing",
  phaseEndsAt: now + 30_000,
  round: { number: 1, categoryId, letter, answers: [] },
});

describe("palavras", () => {
  test("normaliza acento, hífen e espaço", () => {
    expect(normalizeKey("Maracujá")).toBe("maracuja");
    expect(normalizeKey("Romeu e Julieta")).toBe("romeuejulieta");
    expect(normalizeKey("fruta-do-conde")).toBe("frutadoconde");
  });

  test("toda categoria tem letras jogáveis e nenhuma palavra vazia", () => {
    for (const category of CATEGORIES) {
      expect(category.words.every((word) => normalizeKey(word).length >= 2)).toBe(true);
      expect(lettersWith(category.id, MIN_WORDS_PER_LETTER).length).toBeGreaterThanOrEqual(4);
    }
  });

  test("aceita variações da mesma resposta", () => {
    expect(matchAnswer("frutas", "G", "goiaba")?.word).toBe("goiaba");
    expect(matchAnswer("frutas", "G", "GOIABA!!")?.word).toBe("goiaba");
    expect(matchAnswer("frutas", "G", "uma goiaba 😋")?.word).toBe("goiaba");
    expect(matchAnswer("frutas", "G", "goiabas")?.word).toBe("goiaba");
    expect(matchAnswer("frutas", "M", "maracuja")?.word).toBe("maracujá");
    expect(matchAnswer("frutas", "F", "fruta do conde")?.word).toBe("fruta-do-conde");
    expect(matchAnswer("frutas", "L", "limões")?.word).toBe("limão");
    expect(matchAnswer("animais", "L", "leões")?.word).toBe("leão");
    expect(matchAnswer("doces", "R", "romeu e julieta")?.word).toBe("romeu e julieta");
  });

  test("um erro de digitação passa em palavra grande, se só uma servir", () => {
    expect(matchAnswer("frutas", "G", "graviloa")?.word).toBe("graviola");
    expect(matchAnswer("frutas", "G", "goiba")).toBeNull(); // curta demais
  });

  test("recusa letra errada, outra categoria, frase e link", () => {
    expect(matchAnswer("frutas", "G", "banana")).toBeNull();
    expect(matchAnswer("frutas", "G", "gato")).toBeNull();
    expect(matchAnswer("frutas", "G", "goiaba é a melhor fruta do mundo")).toBeNull();
    expect(matchAnswer("frutas", "G", "goiaba.com/123")).toBeNull();
  });

  test("também valia vem da mesma letra", () => {
    expect(wordsFor("frutas", "G")).toContain("graviola");
    expect(wordsFor("frutas", "G").every((word) => normalizeKey(word).startsWith("g"))).toBe(true);
  });
});

describe("comandos", () => {
  test("lê os comandos do moderador", () => {
    expect(parseCommand("!stop")).toBe("stop");
    expect(parseCommand("!STOP pular")).toBe("skip");
    expect(parseCommand("!stop próxima")).toBe("skip");
    expect(parseCommand("!stop zerar")).toBe("reset");
    expect(parseCommand("!stopix")).toBeNull();
    expect(parseCommand("goiaba")).toBeNull();
  });
});

describe("rodada", () => {
  test("sorteio respeita letras com palavras suficientes e evita repetir", () => {
    const rng = seeded(7);
    const used: string[] = [];
    let previous = null as { categoryId: string; letter: string } | null;
    for (let number = 1; number <= 30; number += 1) {
      const round = drawRound(number, used, previous, DEFAULT_OPTIONS, rng);
      expect(wordsFor(round.categoryId, round.letter).length).toBeGreaterThanOrEqual(5);
      expect(["K", "W", "Y", "X", "Z", "Q"]).not.toContain(round.letter);
      expect(used).not.toContain(`${round.categoryId}:${round.letter}`);
      if (previous) expect(round.letter).not.toBe(previous.letter);
      used.push(`${round.categoryId}:${round.letter}`);
      previous = round;
    }
  });

  test("só sorteia as categorias escolhidas", () => {
    const options = { ...DEFAULT_OPTIONS, categories: ["animais"] };
    for (let i = 0; i < 10; i += 1) {
      expect(drawRound(1, [], null, options, seeded(i + 1)).categoryId).toBe("animais");
    }
  });

  test("pontos: primeira 150, nova 100, repetida 50; uma por pessoa", () => {
    let state = playing("frutas", "G");
    const send = (id: string, text: string, at = 1) => {
      const result = submitAnswer(state, player(id), text, at);
      state = result.state;
      return result.outcome;
    };
    const first = send("ana", "goiaba");
    expect(first.type === "accepted" && first.answer.points).toBe(POINTS.first);
    const repeated = send("bia", "Goiaba");
    expect(repeated.type === "accepted" && repeated.answer.kind).toBe("repeated");
    const fresh = send("caio", "graviola");
    expect(fresh.type === "accepted" && fresh.answer.points).toBe(POINTS.new);
    expect(send("ana", "groselha").type).toBe("already");
    expect(send("duda", "banana").type).toBe("invalid");
    expect(send("duda", "guaraná").type).toBe("accepted");
    expect(ranking(state.scores).map((entry) => entry.player.id)).toEqual([
      "ana",
      "caio",
      "duda",
      "bia",
    ]);
  });

  test("avisa quando alguém passa outro no placar", () => {
    let state = playing("frutas", "G");
    state = submitAnswer(state, player("ana"), "goiaba", 1).state; // 150
    state = submitAnswer(state, player("bia"), "graviola", 2).state; // 100
    state = { ...state, round: { ...state.round, answers: [] } };
    state = submitAnswer(state, player("ana"), "guaraná", 3).state; // ana 300
    const result = submitAnswer(state, player("bia"), "groselha", 4); // bia 200
    expect(result.outcome.type === "accepted" && result.outcome.overtake).toBeUndefined();
    state = { ...result.state, round: { ...result.state.round, answers: [] } };
    state = submitAnswer(state, player("bia"), "gabiroba", 5).state; // bia 350 (150, primeira)
    expect(ranking(state.scores)[0].player.id).toBe("bia");
    state = { ...state, round: { ...state.round, answers: [] } };
    state = submitAnswer(state, player("caio"), "goiaba", 6).state; // caio 150, sem passar ninguém
    const passing = submitAnswer(state, player("duda"), "graviola", 7); // duda 100
    expect(passing.outcome.type === "accepted" && passing.outcome.overtake).toBeUndefined();
    state = { ...passing.state, round: { ...passing.state.round, answers: [] } };
    const overtake = submitAnswer(state, player("duda"), "goiaba", 8); // duda 250 > caio 150
    expect(overtake.outcome.type === "accepted" && overtake.outcome.overtake).toEqual({
      player: player("duda"),
      passed: player("caio"),
      position: 3,
    });
  });

  test("resposta fora do tempo não vale", () => {
    const state = playing("frutas", "G");
    expect(submitAnswer(state, player("ana"), "goiaba", 31_000).outcome.type).toBe("ignored");
  });
});

describe("fases", () => {
  test("sorteio → valendo → stop → resultado → intervalo → próxima rodada", () => {
    const rng = seeded(3);
    const options = { ...DEFAULT_OPTIONS, rounds: 2 };
    let state = createGame(0, options, rng);
    expect(state.phase).toBe("drawing");
    expect(tick(state, 10, options, rng)).toBe(state);
    state = tick(state, TIMINGS.drawMs, options, rng);
    expect(state.phase).toBe("playing");
    const letter = state.round.letter;
    const word = wordsFor(state.round.categoryId, letter)[0];
    state = submitAnswer(state, player("ana"), word, TIMINGS.drawMs + 100).state;
    state = forceStop(state, TIMINGS.drawMs + 200);
    expect(state.phase).toBe("stop");
    state = tick(state, state.phaseEndsAt, options, rng);
    expect(state.phase).toBe("results");
    expect(state.round.summary?.podium[0].player.id).toBe("ana");
    expect(state.round.summary?.alsoValid).not.toContain(word);
    state = tick(state, state.phaseEndsAt, options, rng);
    expect(state.phase).toBe("intermission");
    state = tick(state, state.phaseEndsAt, options, rng);
    expect(state.phase).toBe("drawing");
    expect(state.round.number).toBe(2);
    expect(state.scores.ana.points).toBe(POINTS.first);
  });

  test("última rodada vai para o campeão e depois começa outra partida", () => {
    const rng = seeded(5);
    const options = { ...DEFAULT_OPTIONS, rounds: 1 };
    let state = createGame(0, options, rng);
    for (const phase of ["playing", "stop", "results", "final", "drawing"]) {
      state = tick(state, state.phaseEndsAt, options, rng);
      expect(state.phase).toBe(phase as GameState["phase"]);
    }
    expect(state.game).toBe(2);
    expect(state.scores).toEqual({});
  });

  test("pular troca a rodada e devolve os pontos dela", () => {
    const rng = seeded(9);
    let state = playing("frutas", "G");
    state = submitAnswer(state, player("ana"), "goiaba", 1).state;
    state = skip(state, 2, DEFAULT_OPTIONS, rng);
    expect(state.phase).toBe("drawing");
    expect(state.round.number).toBe(1);
    expect(state.round.answers).toEqual([]);
    expect(state.scores.ana).toBeUndefined();
  });

  test("restaura só estado válido", () => {
    const state = createGame(0, DEFAULT_OPTIONS, seeded());
    expect(restoreGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(restoreGame({ version: 2 })).toBeNull();
    expect(restoreGame(null)).toBeNull();
  });
});
