"use client";

import { type GameCommand, TIMINGS, getCategory, ranking } from "@stopix/game-core";
import { Hand, RotateCcw, SkipForward } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LiveSettings } from "../settings";
import {
  playAnswerSound,
  playChampionSound,
  playCountdownTick,
  playDrawTick,
  playGoSound,
  playOvertakeSound,
  playStopSound,
  playWinSound,
  setSoundVolume,
} from "../sounds";
import { type GameFeedEvent, useStopGame } from "../use-stop-game";
import { AnswersFeed } from "./answers-feed";
import { FinalScreen } from "./final-screen";
import { HeroCard } from "./hero-card";
import { Leaderboard } from "./leaderboard";
import { type OvertakeToast, OvertakeToasts } from "./overtake-toasts";
import { ResultsScreen } from "./results-screen";
import { StopScreen } from "./stop-screen";
import { TopBar } from "./top-bar";
import { secondsLeft, useNow } from "./use-now";

export const STAGE_WIDTH = 540;
export const STAGE_HEIGHT = 960;

/** Palco 9:16 de tamanho fixo, escalado para caber na fonte de navegador. */
function Stage({ children, transparent }: { children: ReactNode; transparent: boolean }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className={cn("absolute top-1/2 left-1/2 overflow-hidden", !transparent && "stage-bg")}
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Dots() {
  return <div className="stage-dots pointer-events-none absolute inset-0" aria-hidden />;
}

function Controls({ onCommand }: { onCommand: (command: GameCommand) => void }) {
  const button =
    "glass flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-white hover:bg-white/20";
  return (
    <div className="absolute inset-x-0 bottom-1 z-40 flex justify-center gap-1.5 opacity-0 transition-opacity hover:opacity-100">
      <button type="button" className={button} onClick={() => onCommand("stop")}>
        <Hand className="size-3.5" /> STOP agora
      </button>
      <button type="button" className={button} onClick={() => onCommand("skip")}>
        <SkipForward className="size-3.5" /> Pular
      </button>
      <button type="button" className={button} onClick={() => onCommand("reset")}>
        <RotateCcw className="size-3.5" /> Nova partida
      </button>
    </div>
  );
}

/** Overlay da live: o jogo inteiro, para fonte de navegador em 1080×1920 (9:16). */
export function Overlay({ settings }: { settings: LiveSettings }) {
  const [toast, setToast] = useState<OvertakeToast | null>(null);
  const toastQueue = useRef<OvertakeToast[]>([]);
  const toastId = useRef(0);

  useEffect(() => setSoundVolume(settings.sound ? settings.volume / 100 : 0), [settings]);

  const showNextToast = useCallback(() => {
    setToast(toastQueue.current.shift() ?? null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(showNextToast, 2600);
    return () => clearTimeout(timer);
  }, [toast, showNextToast]);

  const onFeed = useCallback((event: GameFeedEvent) => {
    if (event.kind === "answer") {
      playAnswerSound(event.answer.kind);
      if (event.overtake) {
        toastId.current += 1;
        // Chat lotado: fica só com os 3 últimos avisos na fila.
        toastQueue.current = [
          ...toastQueue.current,
          { ...event.overtake, id: toastId.current },
        ].slice(-3);
        setToast((current) => current ?? toastQueue.current.shift() ?? null);
        playOvertakeSound();
      }
      return;
    }
    if (event.phase === "playing") playGoSound();
    else if (event.phase === "stop") playStopSound();
    else if (event.phase === "results" && event.state.round.summary?.podium.length) playWinSound();
    else if (event.phase === "final") playChampionSound();
  }, []);

  const { state, chat, viewers, command } = useStopGame(settings, onFeed);
  const now = useNow(200);

  const seconds = state ? secondsLeft(state.phaseEndsAt, now) : 0;
  const playing = state?.phase === "playing";

  // Tique-taque dos últimos 5 segundos.
  const lastTick = useRef(-1);
  useEffect(() => {
    if (!playing || seconds > 5 || seconds <= 0 || seconds === lastTick.current) return;
    lastTick.current = seconds;
    playCountdownTick(seconds <= 3);
  }, [playing, seconds]);

  const spinTicks = useRef(0);
  const onSpinTick = useCallback(() => {
    spinTicks.current += 1;
    if (spinTicks.current % 2 === 0) playDrawTick();
  }, []);

  if (!state) return <Stage transparent={settings.background === "transparent"}>{null}</Stage>;

  const category = getCategory(state.round.categoryId);
  const board = ranking(state.scores);
  const { phase, round } = state;
  const phaseMs =
    phase === "playing"
      ? settings.roundSec * 1000
      : phase === "intermission"
        ? settings.intermissionSec * 1000
        : TIMINGS.drawMs;
  const fraction =
    phase === "drawing" ? 1 : phase === "stop" ? 0 : (state.phaseEndsAt - now) / phaseMs;
  const dialSeconds = phase === "drawing" ? settings.roundSec : phase === "stop" ? 0 : seconds;

  return (
    <Stage transparent={settings.background === "transparent"}>
      {settings.background === "full" ? <Dots /> : null}
      <TopBar round={round.number} totalRounds={state.totalRounds} viewers={viewers} chat={chat} />

      <div className="absolute inset-x-0 top-[70px]">
        <HeroCard
          phase={phase}
          letter={round.letter}
          category={category}
          fraction={fraction}
          seconds={dialSeconds}
          onSpinTick={settings.sound ? onSpinTick : undefined}
        />
      </div>

      <div className="absolute inset-x-0 top-[318px] h-[308px]">
        <AnswersFeed answers={round.answers} />
      </div>

      <OvertakeToasts toast={toast} top={634} />

      <div className="absolute inset-x-0 top-[676px]">
        <Leaderboard ranking={board} />
      </div>

      <AnimatePresence>
        {phase === "stop" ? <StopScreen key="stop" answered={round.answers.length} /> : null}
        {phase === "results" && round.summary ? (
          <ResultsScreen key="results" summary={round.summary} round={round.number} />
        ) : null}
        {phase === "final" ? <FinalScreen key="final" ranking={board} seconds={seconds} /> : null}
      </AnimatePresence>

      {settings.preview ? null : <Controls onCommand={command} />}
    </Stage>
  );
}
