import { type Category, getCategory } from "./categories";
import { initialOf, normalizeKey } from "./normalize";

// Confere a resposta do chat: categoria + letra. Aceita sem acento, com hífen ou
// espaço ("fruta do conde"), plural ("goiabas"), artigo na frente ("uma goiaba") e um
// erro de digitação em palavras maiores ("graviloa"), desde que só uma palavra sirva.

/** Artigo no começo não conta para a letra: "o rei leão" → "rei leão". */
const LEADING_ARTICLE = /^(?:um|uma|uns|umas|o|a|os|as)\s+/i;

type Entry = { key: string; word: string };
type Index = { byKey: Map<string, string>; byLetter: Map<string, Entry[]> };

const indexes = new Map<string, Index>();

const indexOf = (category: Category): Index => {
  const cached = indexes.get(category.id);
  if (cached) return cached;
  const byKey = new Map<string, string>();
  const byLetter = new Map<string, Entry[]>();
  for (const word of category.words) {
    // "O Rei Leão" vale na letra R, igual a quem manda "o rei leão" no chat.
    const key = normalizeKey(word.replace(LEADING_ARTICLE, ""));
    if (!key || byKey.has(key)) continue;
    byKey.set(key, word);
    const letter = key.charAt(0).toUpperCase();
    const list = byLetter.get(letter) ?? [];
    list.push({ key, word });
    byLetter.set(letter, list);
  }
  const index = { byKey, byLetter };
  indexes.set(category.id, index);
  return index;
};

/** Palavras da categoria que começam com a letra (grafia de exibição). */
export const wordsFor = (categoryId: string, letter: string): string[] => {
  const category = getCategory(categoryId);
  if (!category) return [];
  return (indexOf(category).byLetter.get(letter.toUpperCase()) ?? []).map((entry) => entry.word);
};

/** Letras que têm pelo menos `min` palavras na categoria. */
export const lettersWith = (categoryId: string, min: number): string[] => {
  const category = getCategory(categoryId);
  if (!category) return [];
  return [...indexOf(category).byLetter.entries()]
    .filter(([, list]) => list.length >= min)
    .map(([letter]) => letter)
    .sort();
};

const SAYING = /^(?:eh|e|é)\s+/i;

/** Texto do chat → chave candidata. Nulo se não parece resposta (link, frase longa…). */
export const answerKey = (text: string): string | null => {
  const clean = text
    .trim()
    .replace(/[\p{Extended_Pictographic}‍️]/gu, "")
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "")
    .replace(SAYING, "")
    .replace(LEADING_ARTICLE, "");
  if (!clean || clean.length > 40 || clean.split(/\s+/).length > 5) return null;
  // Link e @ não são resposta; número passa ("GTA 5" vira "gta").
  if (/[@#/]|https?:|www\./i.test(clean)) return null;
  const key = normalizeKey(clean);
  return key.length >= 2 ? key : null;
};

const pluralVariants = (key: string): string[] => {
  const variants: string[] = [];
  if (key.endsWith("oes") || key.endsWith("aes")) variants.push(`${key.slice(0, -3)}ao`);
  if (key.endsWith("ais")) variants.push(`${key.slice(0, -2)}l`);
  if (key.endsWith("eis")) variants.push(`${key.slice(0, -2)}l`);
  if (key.endsWith("ns")) variants.push(`${key.slice(0, -2)}m`);
  if (key.endsWith("es")) variants.push(key.slice(0, -2));
  if (key.endsWith("s")) variants.push(key.slice(0, -1));
  return variants;
};

/** Distância de edição com transposição (Damerau), parando cedo acima de 1. */
const withinOneEdit = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const restA = a.slice(i);
  const restB = b.slice(i);
  if (restA.slice(1) === restB.slice(1)) return true; // troca de uma letra
  if (restA.slice(1) === restB) return true; // letra a mais em a
  if (restA === restB.slice(1)) return true; // letra a menos em a
  return (
    restA.length >= 2 &&
    restA[0] === restB[1] &&
    restA[1] === restB[0] &&
    restA.slice(2) === restB.slice(2)
  );
};

export const TYPO_MIN_LENGTH = 6;

export type MatchResult = { word: string; key: string } | null;

/** Confere a resposta: devolve a palavra (grafia certa) e a chave, ou nulo. */
export const matchAnswer = (categoryId: string, letter: string, text: string): MatchResult => {
  const category = getCategory(categoryId);
  const key = answerKey(text);
  if (!category || !key) return null;
  const upper = letter.toUpperCase();
  if (key.charAt(0).toUpperCase() !== upper) return null;
  const index = indexOf(category);

  for (const candidate of [key, ...pluralVariants(key)]) {
    const word = index.byKey.get(candidate);
    if (word) return { word, key: candidate };
  }

  if (key.length < TYPO_MIN_LENGTH) return null;
  const close = (index.byLetter.get(upper) ?? []).filter(
    (entry) => entry.key.length >= TYPO_MIN_LENGTH && withinOneEdit(key, entry.key),
  );
  return close.length === 1 ? { word: close[0].word, key: close[0].key } : null;
};

export { initialOf };
