// Chave de comparação: minúsculas, sem acento, só a-z. "Maracujá", "maracuja" e
// "MARACUJÁ!" viram "maracuja"; "Romeu e Julieta" vira "romeuejulieta".
export const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

/** Primeira letra (sem acento) de uma palavra: "Ácido" → "A". */
export const initialOf = (value: string): string => normalizeKey(value).charAt(0).toUpperCase();
