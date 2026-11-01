// Código da sala: 4 letras sem I e O (não confundem com 1 e 0). Usado no servidor e no navegador.

export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 4;

export const normalizeCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, CODE_LENGTH);

export const isRoomCode = (value: string) => new RegExp(`^[A-Z]{${CODE_LENGTH}}$`).test(value);
