"use client";

import { type GameCommand, TIMINGS, getCategory, ranking } from "@stopix/game-core";
import { Hand, RotateCcw, SkipForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
import { AnswersGrid } from "./answers-grid";
import { FinalScreen } from "./final-screen";
import { LetterDial } from "./letter-dial";
import { type OvertakeToast, OvertakeToasts } from "./overtake-toasts";
import { PromptBanner } from "./prompt-banner";
import { RankingBoard } from "./ranking-board";
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

function Bokeh() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span className="bokeh" style={{ width: 70, height: 70, top: 150, left: -20 }} />
      <span
        className="bokeh"
        style={{ width: 34, height: 34, top: 260, right: 40, animationDelay: "-4s" }}
      />
      <span
        className="bokeh"
        style={{ width: 120, height: 120, top: 520, right: -50, animationDelay: "-7s" }}
      />
      <span
        className="bokeh"
        style={{ width: 26, height: 26, top: 90, right: 120, animationDelay: "-2s" }}
      />
      <span
        className="bokeh"
        style={{ width: 48, height: 48, top: 640, left: 30, animationDelay: "-9s" }}
      />
    </div>
  );
}

function Controls({ onCommand }: { onCommand: (command: GameCommand) => void }) {
  const button =
    "flex items-center gap-1 rounded-full bg-ink/90 px-3 py-1.5 text-[12px] font-black text-white hover:bg-ink";
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
      {settings.background === "full" ? <Bokeh /> : null}
      <TopBar round={round.number} totalRounds={state.totalRounds} viewers={viewers} chat={chat} />

      <div className="absolute inset-x-0 top-[56px] flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${round.number}-${round.categoryId}`}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="flex items-center gap-1.5 rounded-full border-[3px] border-ink bg-gradient-to-b from-[#ff6fb5] to-[#d61f6e] px-5 py-0.5 shadow-[0_3px_0_#1b0b3a]"
          >
            <span className="text-[20px]">{category?.emoji}</span>
            <span className="game-text-sm text-[24px] text-white">{category?.name}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 top-[100px] flex justify-center">
        <LetterDial
          letter={round.letter}
          spinning={phase === "drawing"}
          fraction={fraction}
          seconds={dialSeconds}
          onSpinTick={settings.sound ? onSpinTick : undefined}
        />
      </div>

      <div className="absolute inset-x-0 top-[326px]">
        <PromptBanner phase={phase} ask={category?.ask ?? ""} letter={round.letter} />
      </div>

      <div className="absolute inset-x-0 top-[408px] h-[236px]">
        {phase === "drawing" ? null : <AnswersGrid answers={round.answers} />}
      </div>

      <OvertakeToasts toast={toast} />

      <div className="absolute inset-x-0 top-[712px]">
        <RankingBoard ranking={board} />
      </div>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-between px-4 text-[11px] font-black text-white/70">
        <span>Comente sua resposta no chat 💬</span>
        <span className="font-[family-name:var(--font-display)] text-[15px] tracking-wide text-white/85">
          STOPIX
        </span>
      </div>

      <AnimatePresence>
        {phase === "stop" ? <StopScreen key="stop" answered={round.answers.length} /> : null}
        {phase === "results" && round.summary ? (
          <ResultsScreen key="results" summary={round.summary} />
        ) : null}
        {phase === "final" ? <FinalScreen key="final" ranking={board} seconds={seconds} /> : null}
      </AnimatePresence>

      {settings.preview ? null : <Controls onCommand={command} />}
    </Stage>
  );
}
