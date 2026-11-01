"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GIFTS, findGift, giftImage } from "../gift-catalog";

type LiveGift = { name: string; image: string };

/**
 * Escolha do presente com a imagem: grade com os presentes do TikTok, busca e os que
 * já apareceram na live. Presente fora da lista dá para escrever pelo nome.
 */
export function GiftPicker({
  value,
  onChange,
  liveGifts,
  label,
  taken,
}: {
  value: string;
  onChange: (name: string) => void;
  liveGifts: LiveGift[];
  label: string;
  /** Presentes já usados em outros efeitos (aparecem marcados). */
  taken: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const liveCatalog = useMemo(
    () => Object.fromEntries(liveGifts.map((gift) => [gift.name.trim().toLowerCase(), gift.image])),
    [liveGifts],
  );
  const options = useMemo(() => {
    const extra = liveGifts
      .filter((gift) => !findGift(gift.name))
      .map((gift) => ({ name: gift.name, image: gift.image }));
    const all = [...GIFTS.map((gift) => ({ name: gift.name, image: gift.image })), ...extra];
    const wanted = query.trim().toLowerCase();
    return wanted ? all.filter((gift) => gift.name.toLowerCase().includes(wanted)) : all;
  }, [liveGifts, query]);

  const image = giftImage(value, liveCatalog);
  const takenKeys = new Set(taken.map((name) => name.trim().toLowerCase()));

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Presente para ${label}`}
        className="flex h-12 w-full items-center gap-2 rounded-xl border border-line bg-night/70 px-2 text-left hover:bg-white/5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center">
          {image ? (
            // biome-ignore lint/performance/noImgElement: ícone pequeno do presente
            <img
              src={image}
              alt=""
              className="size-9 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xl">🎁</span>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold">
          {value || "Escolher presente"}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute top-[52px] right-0 left-0 z-30 rounded-2xl border border-line bg-panel p-3 shadow-2xl sm:left-auto sm:w-[520px]">
          <label className="mb-2 flex h-10 items-center gap-2 rounded-xl border border-line bg-night/70 px-3">
            <Search className="size-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar presente"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              // biome-ignore lint/a11y/noAutofocus: a busca abre pronta para digitar
              autoFocus
            />
          </label>
          <div className="grid max-h-[300px] grid-cols-4 gap-1 overflow-y-auto pr-1 sm:grid-cols-6">
            {options.map((gift) => {
              const selected = gift.name.toLowerCase() === value.trim().toLowerCase();
              const used = !selected && takenKeys.has(gift.name.toLowerCase());
              return (
                <button
                  key={gift.name}
                  type="button"
                  onClick={() => {
                    onChange(gift.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  title={used ? `${gift.name} (já usado em outro efeito)` : gift.name}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl p-1.5 transition hover:bg-white/10",
                    selected && "bg-aqua/20 ring-2 ring-aqua",
                    used && "opacity-40",
                  )}
                >
                  {gift.image ? (
                    // biome-ignore lint/performance/noImgElement: ícone pequeno do presente
                    <img
                      src={gift.image}
                      alt=""
                      loading="lazy"
                      className="size-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex size-12 items-center justify-center text-2xl">🎁</span>
                  )}
                  <span className="line-clamp-2 text-center text-[10px] leading-tight font-semibold">
                    {gift.name}
                  </span>
                </button>
              );
            })}
            {options.length === 0 ? (
              <p className="col-span-full py-6 text-center text-sm text-muted">
                Nenhum presente com esse nome.
              </p>
            ) : null}
          </div>
          <form
            className="mt-2 flex gap-2 border-t border-line pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              const name = query.trim();
              if (!name) return;
              onChange(name);
              setOpen(false);
              setQuery("");
            }}
          >
            <span className="flex-1 self-center text-xs text-muted">
              Não está na lista? Escreva o nome exato na busca e use assim mesmo.
            </span>
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              Usar “{query.trim() || "…"}”
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
