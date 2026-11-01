"use client";

import { type GameState, wordsFor } from "@stopix/game-core";

// Mensagem de chat como o motor precisa. Vem do Neon Live Labs (TikTok/Twitch) ou do
// chat simulado.
export type ChatEvent = {
  key: string;
  comment: string;
  user: { id: string; name: string; avatar?: string; handle: string; isModerator: boolean };
};

export type ChatStatus = "connecting" | "online" | "offline" | "not-configured" | "demo";

export type ChatHandlers = {
  onEvent: (event: ChatEvent) => void;
  onStatus: (status: ChatStatus) => void;
  /** Pessoas assistindo agora (channels/{cid}/stats/viewers). */
  onViewers: (viewers: number) => void;
};

// Subconjunto do LiveEvent do Neon (packages/shared/src/index.ts no neon-live-labs).
type NeonLiveEvent = {
  type: string;
  comment?: string;
  platform?: string;
  user?: { uniqueId?: string; nickname?: string; avatar?: string; isModerator?: boolean };
};

const neonConfig = () => {
  const databaseURL = process.env.NEXT_PUBLIC_NEON_FIREBASE_DATABASE_URL;
  const projectId = process.env.NEXT_PUBLIC_NEON_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_NEON_FIREBASE_API_KEY;
  return databaseURL && projectId && apiKey ? { databaseURL, projectId, apiKey } : null;
};

/**
 * Escuta o chat da live no Realtime Database do Neon: channels/{cid}/events. As regras
 * de lá deixam ler sem login com o código do canal (é o que os overlays do Neon fazem).
 * Só mensagens novas: começa depois da última que já existia.
 */
export function connectNeonChat(cid: string, handlers: ChatHandlers): () => void {
  const { onEvent, onStatus, onViewers } = handlers;
  const config = neonConfig();
  if (!config) {
    onStatus("not-configured");
    return () => {};
  }
  let cancelled = false;
  const offs: (() => void)[] = [];
  onStatus("connecting");

  (async () => {
    const [{ getApps, initializeApp }, db] = await Promise.all([
      import("firebase/app"),
      import("firebase/database"),
    ]);
    if (cancelled) return;
    const app = getApps().find((item) => item.name === "neon") ?? initializeApp(config, "neon");
    const rtdb = db.getDatabase(app);
    offs.push(
      db.onValue(db.ref(rtdb, ".info/connected"), (snap) =>
        onStatus(snap.val() ? "online" : "offline"),
      ),
      db.onValue(db.ref(rtdb, `channels/${cid}/stats/viewers`), (snap) =>
        onViewers(Number(snap.val()) || 0),
      ),
    );
    const list = db.ref(rtdb, `channels/${cid}/events`);
    const last = await db.get(db.query(list, db.limitToLast(1)));
    if (cancelled) return;
    let lastKey = "";
    last.forEach((child) => {
      lastKey = child.key ?? "";
    });
    const fresh = lastKey
      ? db.query(list, db.orderByKey(), db.startAfter(lastKey))
      : db.query(list, db.orderByKey());
    offs.push(
      db.onChildAdded(fresh, (child) => {
        const event = child.val() as NeonLiveEvent;
        if (event?.type !== "chat" || !event.comment || !event.user) return;
        const handle = event.user.uniqueId || event.user.nickname || "";
        onEvent({
          key: child.key ?? "",
          comment: event.comment,
          user: {
            id: `${event.platform ?? "tiktok"}:${handle}`,
            name: event.user.nickname || handle,
            avatar: event.user.avatar || undefined,
            handle: handle.toLowerCase(),
            isModerator: Boolean(event.user.isModerator),
          },
        });
      }),
    );
  })().catch((error) => {
    console.error("[stopix] chat do Neon", error);
    onStatus("offline");
  });

  return () => {
    cancelled = true;
    for (const off of offs) off();
  };
}

const BOTS = [
  "ana.joga",
  "joaozin",
  "lu_silva",
  "pedrão",
  "mari.tv",
  "caio",
  "bia_gamer",
  "theo",
  "duda",
  "rafa_br",
  "gabi ✨",
  "marcos.vini",
  "tati",
  "leo_fps",
];

const NOISE = ["kkkkkk", "boa noite!", "ai que difícil", "eu sabia 😭", "vamoo", "oi live", "hmm"];

/**
 * Chat de mentira para testar o overlay: os bots mandam respostas certas (algumas
 * repetidas), umas erradas e conversa, como num chat de verdade.
 */
export function connectDemoChat(getState: () => GameState | null, handlers: ChatHandlers) {
  const { onEvent, onStatus, onViewers } = handlers;
  onStatus("demo");
  onViewers(37);
  let count = 0;
  const timer = setInterval(() => {
    const state = getState();
    count += 1;
    if (count % 8 === 0) onViewers(30 + Math.floor(Math.random() * 25));
    const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
    let comment = NOISE[Math.floor(Math.random() * NOISE.length)];
    if (state?.phase === "playing") {
      const valid = wordsFor(state.round.categoryId, state.round.letter);
      const roll = Math.random();
      // Palavras do começo da lista saem mais (o chat repete as óbvias).
      if (roll < 0.7 && valid.length) {
        const index = Math.floor(valid.length * Math.random() ** 2);
        comment = valid[index];
        if (Math.random() < 0.3) comment = comment.toUpperCase();
      } else if (roll < 0.85) {
        comment = `${state.round.letter.toLowerCase()}aaa`;
      }
    } else if (Math.random() < 0.6) {
      return;
    }
    onEvent({
      key: `demo-${count}`,
      comment,
      user: { id: `demo:${bot}`, name: bot, handle: bot, isModerator: false },
    });
  }, 900);
  return () => clearInterval(timer);
}
