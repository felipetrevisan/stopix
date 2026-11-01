import { describe, expect, test } from "bun:test";
import {
  DEFAULT_PARTY_SETTINGS,
  PARTY_POINTS,
  PARTY_TIMINGS,
  checkAnswer,
  drawPartyLetter,
  finishReview,
  nextPartyRound,
  partyLetters,
  partyTick,
  requestStop,
  reviewRound,
  sanitizePartySettings,
  startParty,
  voteKey,
  wordsFor,
} from "./index";

const rng = () => 0.42;
const empty = { answers: {}, votes: {}, playerIds: [] as string[] };

describe("modo amigos: respostas", () => {
  test("classifica cada resposta", () => {
    expect(checkAnswer("frutas", "G", "goiaba").status).toBe("valid");
    expect(checkAnswer("frutas", "G", "Goiabas").word).toBe("goiaba");
    expect(checkAnswer("frutas", "G", "gugufruta").status).toBe("unknown");
    expect(checkAnswer("frutas", "G", "banana").status).toBe("invalid");
    expect(checkAnswer("frutas", "G", "  ").status).toBe("empty");
  });

  test("pontos: 10 única, 5 repetida, 20 sozinho; fora da lista depende dos votos", () => {
    const results = reviewRound(
      {
        round: 1,
        letter: "G",
        categories: ["frutas", "animais", "nomes"],
        stoppedBy: "ana",
        playerIds: ["ana", "bia", "caio"],
      },
      {
        ana: { frutas: "goiaba", animais: "gato", nomes: "gugu" },
        bia: { frutas: "Goiaba", animais: "girafa", nomes: "gabriel" },
        caio: { frutas: "graviola", animais: "", nomes: "gogo" },
      },
      {
        // gugu (ana): bia e caio aceitam; gogo (caio): ana e bia recusam.
        [voteKey("ana", "nomes")]: { bia: true, caio: true },
        [voteKey("caio", "nomes")]: { ana: false, bia: false, caio: true },
      },
    );
    const { ana, bia, caio } = results.players;
    expect(ana.answers.frutas.points).toBe(PARTY_POINTS.repeated);
    expect(bia.answers.frutas.points).toBe(PARTY_POINTS.repeated);
    expect(caio.answers.frutas.points).toBe(PARTY_POINTS.unique);
    expect(ana.answers.animais.points).toBe(PARTY_POINTS.unique);
    expect(caio.answers.animais.status).toBe("empty");
    expect(ana.answers.nomes.accepted).toBe(true);
    expect(caio.answers.nomes.accepted).toBe(false);
    expect(caio.answers.nomes.votes).toEqual({ yes: 0, no: 2 });
    expect(bia.answers.nomes.points).toBe(PARTY_POINTS.unique);
    expect(ana.total).toBe(5 + 10 + 10);
    expect(caio.total).toBe(10);
  });

  test("ninguém mais acertou a categoria: 20", () => {
    const results = reviewRound(
      { round: 1, letter: "G", categories: ["frutas"], stoppedBy: null, playerIds: ["ana", "bia"] },
      { ana: { frutas: "goiaba" }, bia: { frutas: "banana" } },
      {},
    );
    expect(results.players.ana.answers.frutas.kind).toBe("alone");
    expect(results.players.ana.total).toBe(PARTY_POINTS.alone);
  });
});

describe("modo amigos: sorteio e configurações", () => {
  test("letras jogáveis têm palavras na maioria das categorias", () => {
    const letters = partyLetters(DEFAULT_PARTY_SETTINGS.categories, false);
    expect(letters.length).toBeGreaterThan(8);
    for (const letter of letters) {
      const covered = DEFAULT_PARTY_SETTINGS.categories.filter(
        (id) => wordsFor(id, letter).length >= 2,
      );
      expect(covered.length).toBeGreaterThanOrEqual(4);
    }
    expect(letters).not.toContain("K");
  });

  test("não repete letra na partida enquanto tiver opção", () => {
    const used: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const letter = drawPartyLetter(DEFAULT_PARTY_SETTINGS.categories, used, false, Math.random);
      expect(used).not.toContain(letter);
      used.push(letter);
    }
  });

  test("configurações malucas viram valores válidos", () => {
    const settings = sanitizePartySettings({
      categories: ["frutas", "xyz"],
      rounds: 999,
      roundSec: 1,
    });
    expect(settings.categories).toEqual(DEFAULT_PARTY_SETTINGS.categories);
    expect(settings.rounds).toBe(20);
    expect(settings.roundSec).toBe(30);
  });
});

describe("modo amigos: fases", () => {
  test("sorteio → valendo → STOP → conferência → placar → próxima → fim", () => {
    const settings = { ...DEFAULT_PARTY_SETTINGS, rounds: 2 };
    let state = startParty(settings, 0, rng);
    expect(state.phase).toBe("drawing");
    state = partyTick(state, settings, PARTY_TIMINGS.drawMs, rng, empty);
    expect(state.phase).toBe("playing");
    state = requestStop(state, "ana", 10_000);
    expect(state).toMatchObject({ phase: "stopping", stoppedBy: "ana" });
    state = partyTick(state, settings, state.endsAt, rng, empty);
    expect(state.phase).toBe("review");
    const word = wordsFor("frutas", state.letter)[0] ?? "x";
    state = finishReview(state, 20_000, {
      answers: { ana: { frutas: word } },
      votes: {},
      playerIds: ["ana"],
    });
    expect(state.phase).toBe("scores");
    expect(state.totals.ana).toBe(word === "x" ? 0 : PARTY_POINTS.unique);
    const first = state.letter;
    state = nextPartyRound(state, settings, 30_000, () => 0.9);
    expect(state).toMatchObject({ phase: "drawing", round: 2 });
    expect(state.letter).not.toBe(first);
    state = partyTick(state, settings, state.endsAt, rng, empty);
    state = partyTick(state, settings, state.endsAt, rng, empty); // tempo acabou
    expect(state).toMatchObject({ phase: "stopping", stoppedBy: null });
    state = partyTick(state, settings, state.endsAt, rng, empty);
    state = partyTick(state, settings, state.endsAt, rng, empty); // conferência expirou
    expect(state.phase).toBe("scores");
    state = partyTick(state, settings, state.endsAt, rng, empty);
    expect(state.phase).toBe("final");
  });
});
