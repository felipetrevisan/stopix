export type Category = {
  id: string;
  /** Nome no selo do topo: "Frutas". */
  name: string;
  emoji: string;
  /** Como o pedido aparece: "MANDA NO CHAT {ask} COM A LETRA G" → "uma fruta". */
  ask: string;
  /** Grafia que aparece na tela (com acento). Sinônimos e variantes valem como palavras. */
  words: readonly string[];
};

/** Lista separada por vírgula (ou quebra de linha) → palavras sem repetição. */
export const words = (text: string): string[] => [
  ...new Set(
    text
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];
