import { normalizeKey } from "./normalize";

// Comandos do chat (moderadores e os @ liberados pelo streamer): "!stop pular".

export const COMMAND_PREFIX = "!stop";

export type GameCommand = "stop" | "skip" | "reset";

const COMMANDS: Record<string, GameCommand> = {
  "": "stop",
  parar: "stop",
  stop: "stop",
  pular: "skip",
  trocar: "skip",
  proxima: "skip",
  zerar: "reset",
  reiniciar: "reset",
  nova: "reset",
};

/** "!stop", "!stop pular", "!STOP zerar" → comando; o resto do chat → nulo. */
export const parseCommand = (comment: string | undefined): GameCommand | null => {
  const text = (comment ?? "").trim().toLowerCase();
  if (!text.startsWith(COMMAND_PREFIX)) return null;
  const rest = text.slice(COMMAND_PREFIX.length);
  if (rest && !/^\s/.test(rest)) return null; // "!stopix" não é comando
  return COMMANDS[normalizeKey(rest)] ?? null;
};

/** Mensagens que nunca são resposta (comandos de outros bots, links). */
export const isAnswerCandidate = (comment: string | undefined): boolean => {
  const text = (comment ?? "").trim();
  return text.length > 0 && text.length <= 40 && !text.startsWith("!");
};
