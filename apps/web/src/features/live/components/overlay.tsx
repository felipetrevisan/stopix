"use client";

import {
  type GameCommand,
  TIMINGS,
  boardAnswers,
  getCategory,
  ranking,
  remainingMs,
} from "@stopix/game-core";
import { Hand, RotateCcw, SkipForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { LiveSettings } from "../settings";
import {
  playAnswerSound,
  playChampionSound,
  playCountdownTick,
  playDrawTick,
  playGiftSound,
  playGoSound,
  playOvertakeSound,
  playStopSound,
  playWinSound,
  setSoundVolume,
} from "../sounds";
import { type GameFeedEvent, useStopGame } from "../use-stop-game";
import { StageWaves } from "@/components/motion/stage-waves";
import { WaveText } from "@/components/motion/wave-text";
import { AnswersGrid } from "./answers-grid";
import { type Burst, EffectBurst } from "./effect-burst";
import { FinalScreen } from "./final-screen";
import { GiftLegend, effectLabel } from "./gift-legend";
import { LetterDial } from "./letter-dial";
import { type FeedToast, FeedToasts } from "./overtake-toasts";
import { Podium } from "./podium";
import { ResultsScreen } from "./results-screen";
import { StopScreen } from "./stop-screen";
import { TopBar } from "./top-bar";
import { useNow } from "./use-now";

export const STAGE_WIDTH = 540;
export const STAGE_HEIGHT = 960;

/** Palco 9:16 de tamanho fixo, escalado para caber na fonte de navegador. */
function Stage({ children, transparent }: { children: ReactNode; transparent: boolean }) {
  // `zoom` (e não transform: scale) faz o navegador desenhar tudo no tamanho final da
  // fonte (1080×1920): texto, bordas e animações ficam nítidos, sem esticar imagem.
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div
        className={cn("relative shrink-0 overflow-hidden", !transparent && "stage-bg")}
        style={
          {
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            zoom: scale ?? 1,
            visibility: scale ? "visible" : "hidden",
            // Bolhas sobem a altura do palco (vh dentro do zoom seria o dobro).
            "--rise": `-${STAGE_HEIGHT + 60}px`,
            "--rise-half": `-${STAGE_HEIGHT / 2}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

function Controls({ onCommand }: { onCommand: (command: GameCommand) => void }) {
  const button =
    "flex items-center gap-1 rounded-full border-2 border-[#120a3a] bg-white px-3 py-1.5 text-[12px] font-black text-[#120a3a]";
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

const BURST_TEXT = {
  time: (seconds: number) => `+${seconds}s`,
  freeze: () => "Congelou!",
  letter: () => "Troca!",
  category: () => "Troca!",
  double: () => "2X pontos!",
} as const;

/** Overlay da live: o jogo inteiro, para fonte de navegador em 1080×1920 (9:16). */
export function Overlay({ settings }: { settings: LiveSettings }) {
  const [toast, setToast] = useState<FeedToast | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const toastQueue = useRef<FeedToast[]>([]);
  const nextId = useRef(0);

  useEffect(() => setSoundVolume(settings.sound ? settings.volume / 100 : 0), [settings]);

  const showNextToast = useCallback(() => setToast(toastQueue.current.shift() ?? null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(showNextToast, 2600);
    return () => clearTimeout(timer);
  }, [toast, showNextToast]);

  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), 1300);
    return () => clearTimeout(timer);
  }, [burst]);

  const pushToast = useCallback((item: FeedToast) => {
    // Chat lotado: fica só com os 4 últimos avisos na fila.
    toastQueue.current = [...toastQueue.current, item].slice(-4);
    setToast((current) => current ?? toastQueue.current.shift() ?? null);
  }, []);

  const onFeed = useCallback(
    (event: GameFeedEvent) => {
      nextId.current += 1;
      const id = nextId.current;
      if (event.kind === "answer") {
        playAnswerSound(event.answer.kind);
        if (event.overtake) {
          pushToast({ ...event.overtake, id, kind: "overtake" });
          playOvertakeSound();
        }
        return;
      }
      if (event.kind === "gift") {
        const label = effectLabel(event.effect, settings.giftAmounts);
        pushToast({
          id,
          kind: "gift",
          player: event.player,
          effect: event.effect,
          image: event.image,
          count: event.count,
          label,
          queued: event.queued,
        });
        playGiftSound(event.effect);
        if (!event.queued) {
          const seconds = settings.giftAmounts.timeSec * event.count;
          setBurst({ id, effect: event.effect, text: BURST_TEXT[event.effect](seconds) });
        }
        return;
      }
      if (event.phase === "playing") playGoSound();
      else if (event.phase === "stop") playStopSound();
      else if (event.phase === "results" && event.state.round.summary?.podium.length)
        playWinSound();
      else if (event.phase === "final") playChampionSound();
    },
    [pushToast, settings.giftAmounts],
  );

  const { state, chat, viewers, catalog, command } = useStopGame(settings, onFeed);
  const now = useNow(200);

  const left = state ? Math.ceil(remainingMs(state, now) / 1000) : 0;
  const playing = state?.phase === "playing";

  // Tique-taque dos últimos 5 segundos.
  const lastTick = useRef(-1);
  useEffect(() => {
    if (!playing || left > 5 || left <= 0 || left === lastTick.current) return;
    lastTick.current = left;
    playCountdownTick(left <= 3);
  }, [playing, left]);

  const spinTicks = useRef(0);
  const onSpinTick = useCallback(() => {
    spinTicks.current += 1;
    if (spinTicks.current % 2 === 0) playDrawTick();
  }, []);

  if (!state) return <Stage transparent={settings.background === "transparent"}>{null}</Stage>;

  const category = getCategory(state.round.categoryId);
  const board = ranking(state.scores);
  const { phase, round } = state;
  const frozen = playing && (round.frozenUntil ?? 0) > now;
  const phaseMs =
    phase === "playing"
      ? settings.roundSec * 1000
      : phase === "intermission"
        ? settings.intermissionSec * 1000
        : TIMINGS.drawMs;
  const fraction =
    phase === "drawing" ? 1 : phase === "stop" ? 0 : remainingMs(state, now) / phaseMs;
  const dialSeconds = phase === "drawing" ? settings.roundSec : phase === "stop" ? 0 : left;
  const showGifts = settings.gifts;
  const prompt =
    phase === "drawing"
      ? "Sorteando a letra…"
      : phase === "intermission" || phase === "final"
        ? "A próxima rodada já vai começar"
        : null;

  return (
    <Stage transparent={settings.background === "transparent"}>
      {settings.background === "full" ? (
        <>
          <div className="stage-dots pointer-events-none absolute inset-0" aria-hidden />
          {settings.waves ? <StageWaves variant="tall" /> : null}
        </>
      ) : null}
      <TopBar round={round.number} totalRounds={state.totalRounds} viewers={viewers} chat={chat} />

      <div className="absolute inset-x-0 top-[60px] flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${round.number}-${round.categoryId}`}
            initial={{ y: -40, opacity: 0, scale: 0.5, rotate: -8 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: 16, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
          >
            <div className="chunky-pill animate-bob flex items-center gap-2 rounded-full px-5 py-1">
              <span className="text-[24px]">{category?.emoji}</span>
              <WaveText
                text={category?.name ?? ""}
                className="game-text-sm text-[26px] text-white"
                amplitude={4}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "absolute top-[122px] flex items-start",
          showGifts ? "left-[14px] right-[12px] justify-between" : "inset-x-0 justify-center",
        )}
      >
        <div className="relative">
          <LetterDial
            letter={round.letter}
            spinning={phase === "drawing"}
            fraction={fraction}
            seconds={dialSeconds}
            frozen={frozen}
            double={(round.multiplier ?? 1) > 1 && (phase === "playing" || phase === "drawing")}
            onSpinTick={settings.sound ? onSpinTick : undefined}
          />
        </div>
        {showGifts ? (
          <GiftLegend
            names={settings.giftNames}
            amounts={settings.giftAmounts}
            counts={round.gifts ?? {}}
            catalog={catalog}
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[170px] h-[120px]">
        <EffectBurst burst={burst} />
      </div>

      <div className="absolute inset-x-0 top-[362px] flex justify-center">
        <motion.div
          key={`${round.number}-${round.categoryId}-${round.letter}-${prompt ?? "ask"}`}
          initial={{ y: 30, opacity: 0, scaleX: 0.6 }}
          animate={{ y: 0, opacity: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="chunky shine w-[512px] rounded-[20px] px-4 py-2 text-center"
        >
          {prompt ? (
            <WaveText text={prompt} className="game-text-sm text-[22px] text-white" amplitude={3} />
          ) : (
            <span className="game-text-sm text-[21px] leading-[1.25] text-white">
              Manda no chat {category?.ask} com a letra{" "}
              <span className="chunky-tile relative -top-0.5 inline-flex size-[30px] items-center justify-center rounded-[9px] align-middle text-[19px] [border-width:2.5px] [box-shadow:0_2px_0_#120a3a]">
                {round.letter}
              </span>
            </span>
          )}
        </motion.div>
      </div>

      <div className="absolute inset-x-0 top-[438px] h-[220px]">
        {phase === "drawing" ? null : <AnswersGrid answers={boardAnswers(round)} />}
      </div>

      <FeedToasts toast={toast} top={668} />

      <div className="absolute inset-x-0 top-[722px]">
        <Podium ranking={board} />
      </div>

      {settings.background === "full" && settings.waves ? (
        <StageWaves variant="front" className="z-[15]" />
      ) : null}

      <AnimatePresence>
        {phase === "stop" ? <StopScreen key="stop" answered={round.answers.length} /> : null}
        {phase === "results" && round.summary ? (
          <ResultsScreen key="results" summary={round.summary} round={round.number} />
        ) : null}
        {phase === "final" ? <FinalScreen key="final" ranking={board} seconds={left} /> : null}
      </AnimatePresence>

      {settings.preview ? null : <Controls onCommand={command} />}
    </Stage>
  );
}
