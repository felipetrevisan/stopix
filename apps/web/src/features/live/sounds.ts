"use client";

import type { AnswerKind } from "@stopix/game-core";

// Sons do overlay, sintetizados com Web Audio (sem arquivos). O LIVE Studio, o OBS e o
// Streamlabs tocam o áudio da fonte de navegador; no OBS e no Streamlabs, marque
// "Controlar áudio via OBS/Streamlabs" para ele entrar na live.

type Note = {
  freq: number;
  at: number;
  length: number;
  type?: OscillatorType;
  gain?: number;
  /** Frequência no fim da nota (glissando). */
  to?: number;
};

let context: AudioContext | null = null;
let volume = 0.6;
let lastAnswerAt = 0;

// Chat lotado não pode virar barulho: no máximo um som de resposta a cada 120 ms.
const ANSWER_SOUND_GAP_MS = 120;

const audio = () => {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  // Navegadores comuns só liberam som depois de um clique; o OBS/LIVE Studio já libera.
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
};

const play = (notes: Note[]) => {
  const ctx = audio();
  if (!ctx || volume <= 0) return;
  const start = ctx.currentTime + 0.01;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type ?? "sine";
    const t0 = start + note.at;
    osc.frequency.setValueAtTime(note.freq, t0);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, t0 + note.length);
    const peak = volume * (note.gain ?? 0.25);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + note.length + 0.02);
  }
};

export const setSoundVolume = (value: number) => {
  volume = Math.min(1, Math.max(0, value));
};

/** Letra passando no sorteio. */
export const playDrawTick = () =>
  play([{ freq: 520 + Math.random() * 300, at: 0, length: 0.05, type: "square", gain: 0.05 }]);

/** Letra sorteada: valendo! */
export const playGoSound = () =>
  play([
    { freq: 660, at: 0, length: 0.12, type: "triangle", gain: 0.22 },
    { freq: 990, at: 0.1, length: 0.28, type: "triangle", gain: 0.22 },
  ]);

/** Resposta certa: a primeira brilha mais; repetida é mais grave. */
export const playAnswerSound = (kind: AnswerKind) => {
  const now = Date.now();
  if (now - lastAnswerAt < ANSWER_SOUND_GAP_MS) return;
  lastAnswerAt = now;
  if (kind === "first") {
    play([
      { freq: 988, at: 0, length: 0.14, type: "triangle", gain: 0.22 },
      { freq: 1319, at: 0.08, length: 0.16, type: "triangle", gain: 0.2 },
      { freq: 1760, at: 0.16, length: 0.3, type: "sine", gain: 0.16 },
    ]);
  } else if (kind === "new") {
    play([
      { freq: 784, at: 0, length: 0.12, type: "triangle", gain: 0.18 },
      { freq: 1175, at: 0.07, length: 0.2, type: "triangle", gain: 0.16 },
    ]);
  } else {
    play([{ freq: 523, at: 0, length: 0.14, type: "triangle", gain: 0.14 }]);
  }
};

export const playOvertakeSound = () =>
  play([{ freq: 300, to: 1200, at: 0, length: 0.35, type: "sawtooth", gain: 0.06 }]);

/** Últimos 5 segundos. */
export const playCountdownTick = (urgent: boolean) =>
  play([{ freq: urgent ? 1046 : 880, at: 0, length: 0.08, type: "square", gain: 0.07 }]);

/** STOP!: buzina. */
export const playStopSound = () =>
  play([
    { freq: 220, at: 0, length: 0.55, type: "sawtooth", gain: 0.16 },
    { freq: 277, at: 0, length: 0.55, type: "sawtooth", gain: 0.12 },
    { freq: 196, to: 150, at: 0.5, length: 0.4, type: "sawtooth", gain: 0.1 },
  ]);

/** Vencedor da rodada: fanfarra curta. */
export const playWinSound = () =>
  play([
    { freq: 523, at: 0, length: 0.18, type: "triangle", gain: 0.25 },
    { freq: 659, at: 0.14, length: 0.18, type: "triangle", gain: 0.25 },
    { freq: 784, at: 0.28, length: 0.18, type: "triangle", gain: 0.25 },
    { freq: 1047, at: 0.42, length: 0.55, type: "triangle", gain: 0.3 },
    { freq: 784, at: 0.42, length: 0.55, type: "sine", gain: 0.15 },
  ]);

/** Campeão da partida: fanfarra longa. */
export const playChampionSound = () =>
  play([
    { freq: 392, at: 0, length: 0.2, type: "triangle", gain: 0.25 },
    { freq: 523, at: 0.18, length: 0.2, type: "triangle", gain: 0.25 },
    { freq: 659, at: 0.36, length: 0.2, type: "triangle", gain: 0.25 },
    { freq: 784, at: 0.54, length: 0.3, type: "triangle", gain: 0.28 },
    { freq: 659, at: 0.84, length: 0.16, type: "triangle", gain: 0.22 },
    { freq: 784, at: 1.0, length: 0.2, type: "triangle", gain: 0.25 },
    { freq: 1047, at: 1.2, length: 0.8, type: "triangle", gain: 0.3 },
    { freq: 523, at: 1.2, length: 0.8, type: "sine", gain: 0.15 },
  ]);

/** Botão "Ouvir os sons" do painel. */
export const playSampleSounds = () => {
  const steps: (() => void)[] = [
    playGoSound,
    () => playAnswerSound("first"),
    () => playAnswerSound("new"),
    () => playAnswerSound("repeated"),
    playOvertakeSound,
    () => playCountdownTick(true),
    playStopSound,
    playWinSound,
  ];
  steps.forEach((step, index) => setTimeout(step, index * 650));
};
