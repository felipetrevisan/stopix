"use client";

import {
  CATEGORIES,
  COMMAND_PREFIX,
  DEFAULT_GIFT_AMOUNTS,
  DEFAULT_GIFT_NAMES,
  GIFT_EFFECTS,
  type GiftEffect,
  POINTS,
} from "@stopix/game-core";
import { Check, Copy, ExternalLink, Volume2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type Background,
  DEFAULT_LIVE_SETTINGS,
  DEMO_CID,
  LIMITS,
  type LiveSettings,
  extractChannelId,
  normalizeHandle,
  overlayPath,
} from "../settings";
import { loadGiftCatalog } from "../chat-source";
import { playSampleSounds, setSoundVolume } from "../sounds";
import { BrandMark } from "./brand-mark";
import { EFFECT_EMOJI, effectLabel } from "./gift-legend";
import { GiftPicker } from "./gift-picker";

const STORAGE_KEY = "stopix:panel";
const ALL_IDS = CATEGORIES.map((category) => category.id);

type Form = {
  channel: string;
  roundSec: string;
  rounds: string;
  intermissionSec: string;
  categories: string[];
  hardLetters: boolean;
  admins: string;
  sound: boolean;
  volume: string;
  background: Background;
  gifts: boolean;
  giftNames: Record<GiftEffect, string>;
  timeSec: string;
  freezeSec: string;
};

const EMPTY_FORM: Form = {
  channel: "",
  roundSec: String(DEFAULT_LIVE_SETTINGS.roundSec),
  rounds: String(DEFAULT_LIVE_SETTINGS.rounds),
  intermissionSec: String(DEFAULT_LIVE_SETTINGS.intermissionSec),
  categories: ALL_IDS,
  hardLetters: false,
  admins: "",
  sound: true,
  volume: String(DEFAULT_LIVE_SETTINGS.volume),
  background: "full",
  gifts: true,
  giftNames: DEFAULT_GIFT_NAMES,
  timeSec: String(DEFAULT_GIFT_AMOUNTS.timeSec),
  freezeSec: String(DEFAULT_GIFT_AMOUNTS.freezeSec),
};

const within = (value: string, [min, max]: readonly [number, number], fallback: number) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && value !== "" ? Math.min(max, Math.max(min, number)) : fallback;
};

const toSettings = (form: Form, cid: string): LiveSettings => ({
  ...DEFAULT_LIVE_SETTINGS,
  cid,
  roundSec: within(form.roundSec, LIMITS.roundSec, DEFAULT_LIVE_SETTINGS.roundSec),
  rounds: within(form.rounds, LIMITS.rounds, DEFAULT_LIVE_SETTINGS.rounds),
  intermissionSec: within(
    form.intermissionSec,
    LIMITS.intermissionSec,
    DEFAULT_LIVE_SETTINGS.intermissionSec,
  ),
  categories: form.categories.length ? form.categories : ALL_IDS,
  hardLetters: form.hardLetters,
  admins: form.admins
    .split(/[\s,]+/)
    .map(normalizeHandle)
    .filter(Boolean),
  sound: form.sound,
  volume: within(form.volume, [0, 100], DEFAULT_LIVE_SETTINGS.volume),
  background: form.background,
  gifts: form.gifts,
  giftNames: Object.fromEntries(
    GIFT_EFFECTS.map((effect) => [
      effect,
      (form.giftNames?.[effect] ?? "").trim() || DEFAULT_GIFT_NAMES[effect],
    ]),
  ) as Record<GiftEffect, string>,
  giftAmounts: {
    timeSec: within(form.timeSec, LIMITS.timeSec, DEFAULT_GIFT_AMOUNTS.timeSec),
    freezeSec: within(form.freezeSec, LIMITS.freezeSec, DEFAULT_GIFT_AMOUNTS.freezeSec),
  },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <h2 className="mb-4 text-lg font-extrabold tracking-tight text-aqua-light">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-bold">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-left text-sm font-bold"
      aria-pressed={on}
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-aqua" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            on ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
      {children}
    </button>
  );
}

const inputClass =
  "h-10 rounded-xl border border-line bg-night/70 px-3 outline-none focus-visible:ring-2 focus-visible:ring-aqua";

/** Painel do streamer: monta o link do overlay e mostra uma prévia com chat simulado. */
export function Panel() {
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setForm({ ...EMPTY_FORM, ...(JSON.parse(saved) as Partial<Form>) });
    } catch {
      // sem localStorage
    }
  }, []);

  const save = (next: Form) => {
    setForm(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sem localStorage
    }
  };
  const update =
    (
      key:
        | "channel"
        | "roundSec"
        | "rounds"
        | "intermissionSec"
        | "admins"
        | "volume"
        | "timeSec"
        | "freezeSec",
    ) =>
    (event: { target: { value: string } }) =>
      save({ ...form, [key]: event.target.value });

  const toggleCategory = (id: string) => {
    const has = form.categories.includes(id);
    const categories = has
      ? form.categories.filter((item) => item !== id)
      : [...form.categories, id];
    save({ ...form, categories: ALL_IDS.filter((item) => categories.includes(item)) });
  };

  const cid = extractChannelId(form.channel);

  // Presentes que já apareceram nessa live, para sugerir e mostrar a imagem.
  const [catalog, setCatalog] = useState<{ name: string; image: string }[]>([]);
  useEffect(() => {
    if (!cid) {
      setCatalog([]);
      return;
    }
    let cancelled = false;
    loadGiftCatalog(cid)
      .then((gifts) => !cancelled && setCatalog(gifts))
      .catch(() => !cancelled && setCatalog([]));
    return () => {
      cancelled = true;
    };
  }, [cid]);
  const overlayUrl = cid ? `${origin}${overlayPath(toSettings(form, cid))}` : "";
  // Prévia com chat simulado e as mesmas opções, sem som (tocaria enquanto você configura).
  const previewPath = useMemo(
    () => overlayPath({ ...toSettings(form, DEMO_CID), demo: true, sound: false, preview: true }),
    [form],
  );

  const copy = async () => {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="flex items-center gap-3">
          <BrandMark size={56} />
          <div>
            <h1 className="text-4xl font-black tracking-tight italic">
              <span className="grad-text">STOPIX</span> <span className="text-white">Live</span>
            </h1>
            <p className="text-sm text-muted">
              Stop (adedonha) com o chat da sua live: sorteia categoria e letra, quem acertar
              primeiro ganha mais pontos. Integrado ao Neon Live Labs.
            </p>
            <Link
              href="/"
              className="mt-1 inline-block text-sm font-bold text-aqua-light underline"
            >
              ← Jogar com os amigos (modo online)
            </Link>
          </div>
        </header>

        <Section title="1. Seu canal no Neon Live Labs">
          <Field
            label="Link de qualquer overlay do Neon (ou o código do canal)"
            hint="No Neon: Overlays → copie o link de um overlay. O Stopix só lê o chat da live."
          >
            <input
              className={inputClass}
              value={form.channel}
              onChange={update("channel")}
              placeholder="Cole aqui o link do overlay"
              spellCheck={false}
            />
          </Field>
          {form.channel && !cid ? (
            <p className="text-sm font-bold text-hot">Não achei o código do canal nesse link.</p>
          ) : null}
        </Section>

        <Section title="2. Partida">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Tempo da rodada (s)"
              hint={`${LIMITS.roundSec[0]} a ${LIMITS.roundSec[1]}`}
            >
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.roundSec}
                onChange={update("roundSec")}
              />
            </Field>
            <Field label="Rodadas por partida" hint={`${LIMITS.rounds[0]} a ${LIMITS.rounds[1]}`}>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.rounds}
                onChange={update("rounds")}
              />
            </Field>
            <Field
              label="Pausa entre rodadas (s)"
              hint={`${LIMITS.intermissionSec[0]} a ${LIMITS.intermissionSec[1]}`}
            >
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.intermissionSec}
                onChange={update("intermissionSec")}
              />
            </Field>
          </div>
          <Toggle
            on={form.hardLetters}
            onClick={() => save({ ...form, hardLetters: !form.hardLetters })}
          >
            Sortear letras difíceis (K, W, Y, X, Z, Q) quando a categoria tiver palavras
          </Toggle>
        </Section>

        <Section title="3. Categorias">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const on = form.categories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-bold transition-colors",
                    on
                      ? "border-aqua bg-aqua/15 text-white"
                      : "border-line bg-transparent text-muted line-through",
                  )}
                >
                  {category.emoji} {category.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-xs font-bold text-muted">
            <button
              type="button"
              className="underline"
              onClick={() => save({ ...form, categories: ALL_IDS })}
            >
              Marcar todas
            </button>
            <span>Nenhuma marcada = todas.</span>
          </div>
        </Section>

        <Section title="4. Presentes mexendo no jogo">
          <Toggle on={form.gifts} onClick={() => save({ ...form, gifts: !form.gifts })}>
            Presentes da live mudam o jogo (a lista aparece ao lado da letra)
          </Toggle>
          {form.gifts ? (
            <>
              <div className="flex flex-col gap-2">
                {GIFT_EFFECTS.map((effect) => {
                  const amounts = toSettings(form, "x").giftAmounts;
                  const name = form.giftNames?.[effect] ?? DEFAULT_GIFT_NAMES[effect];
                  const label = effectLabel(effect, amounts);
                  return (
                    <div key={effect} className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                        {EFFECT_EMOJI[effect]}
                      </span>
                      <span className="w-32 shrink-0 text-sm font-bold">{label}</span>
                      <GiftPicker
                        value={name}
                        label={label}
                        liveGifts={catalog}
                        taken={GIFT_EFFECTS.filter((other) => other !== effect).map(
                          (other) => form.giftNames?.[other] ?? DEFAULT_GIFT_NAMES[other],
                        )}
                        onChange={(gift) =>
                          save({ ...form, giftNames: { ...form.giftNames, [effect]: gift } })
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Segundos a mais por presente"
                  hint={`${LIMITS.timeSec[0]} a ${LIMITS.timeSec[1]}`}
                >
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={form.timeSec}
                    onChange={update("timeSec")}
                  />
                </Field>
                <Field
                  label="Segundos congelado por presente"
                  hint={`${LIMITS.freezeSec[0]} a ${LIMITS.freezeSec[1]}`}
                >
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={form.freezeSec}
                    onChange={update("freezeSec")}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted">
                Toque no presente para trocar. Combo conta cada presente: 5 rosas = 5 vezes mais
                tempo. Troca de letra e de categoria valem uma vez por combo. Presente que chega
                entre rodadas vale quando a próxima começa.
              </p>
            </>
          ) : null}
        </Section>

        <Section title="5. Moderação, som e fundo">
          <Field
            label="Quem mais pode usar os comandos (além dos moderadores)"
            hint="@ separados por vírgula. Ex.: @seu_usuario, @amigo"
          >
            <input
              className={inputClass}
              value={form.admins}
              onChange={update("admins")}
              spellCheck={false}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Toggle on={form.sound} onClick={() => save({ ...form, sound: !form.sound })}>
              Sons do jogo
            </Toggle>
            {form.sound ? (
              <>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.volume}
                  onChange={update("volume")}
                  className="w-36 accent-teal-400"
                  aria-label="Volume"
                />
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold hover:bg-white/5"
                  onClick={() => {
                    setSoundVolume(Number(form.volume) / 100);
                    playSampleSounds();
                  }}
                >
                  <Volume2 className="size-4" /> Ouvir os sons
                </button>
              </>
            ) : null}
          </div>
          <Toggle
            on={form.background === "transparent"}
            onClick={() =>
              save({ ...form, background: form.background === "full" ? "transparent" : "full" })
            }
          >
            Fundo transparente (para pôr o jogo por cima da câmera)
          </Toggle>
        </Section>

        <Section title="6. Link do overlay">
          {cid ? (
            <>
              <div className="flex gap-2">
                <input
                  className={cn(inputClass, "min-w-0 flex-1 text-xs")}
                  readOnly
                  value={overlayUrl}
                />
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1.5 rounded-xl grad-brand px-4 font-bold text-white"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <a
                  href={overlayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center rounded-xl border border-line px-3 hover:bg-white/5"
                  aria-label="Abrir overlay"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
                <li>
                  <b className="text-white">TikTok LIVE Studio:</b> Adicionar fonte → Link → cole o
                  link, tamanho <b className="text-white">1080 × 1920</b> (vertical), ocupando a
                  tela.
                </li>
                <li>
                  <b className="text-white">OBS / Streamlabs:</b> Fonte de navegador 1080 × 1920 e
                  marque “Controlar áudio via OBS”. Em “Interagir” aparecem os botões STOP, Pular e
                  Nova partida.
                </li>
                <li>Conecte a live no Neon Live Labs (app do PC ou nuvem) e pronto.</li>
              </ol>
            </>
          ) : (
            <p className="text-sm text-muted">Cole o link do Neon no passo 1 para gerar o link.</p>
          )}
        </Section>

        <Section title="Regras e comandos">
          <ul className="space-y-1 text-sm text-muted">
            <li>
              Cada pessoa vale <b className="text-white">uma resposta certa por rodada</b>. Acento,
              plural e um errinho de digitação passam.
            </li>
            <li>
              Primeira resposta certa da rodada: <b className="text-white">+{POINTS.first}</b>.
              Palavra que ninguém tinha mandado: <b className="text-white">+{POINTS.new}</b>.
              Repetida: <b className="text-white">+{POINTS.repeated}</b>.
            </li>
            <li>
              Moderadores: <code className="text-aqua-light">{COMMAND_PREFIX}</code> (STOP agora),{" "}
              <code className="text-aqua-light">{COMMAND_PREFIX} pular</code> (troca a letra),{" "}
              <code className="text-aqua-light">{COMMAND_PREFIX} zerar</code> (nova partida).
            </li>
          </ul>
        </Section>
      </div>

      <aside className="flex flex-col items-center gap-3 lg:sticky lg:top-6">
        <span className="text-sm font-bold text-muted">Prévia com chat simulado</span>
        <iframe
          key={previewPath}
          src={previewPath}
          title="Prévia do overlay"
          className="h-[640px] w-[360px] rounded-2xl border border-line bg-night"
        />
        <a
          href={`/live/${DEMO_CID}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-bold text-aqua-light underline"
        >
          Abrir a demonstração em tela cheia
        </a>
      </aside>
    </main>
  );
}
