"use client";

import { type GameState, wordsFor } from "@stopix/game-core";

// Mensagem de chat como o motor precisa. Vem do Neon Live Labs (TikTok/Twitch) ou do
// chat simulado.
export type ChatEvent = {
  key: string;
  comment: string;
  user: { id: string; name: string; avatar?: string; handle: string; isModerator: boolean };
};

/** Presente recebido: `count` é quanto chegou agora (no combo, só o que é novo). */
export type GiftEvent = {
  key: string;
  user: ChatEvent["user"];
  gift: { id: string; name: string; image?: string };
  count: number;
};

/** Presentes já vistos no canal (nome em minúsculas → imagem). */
export type GiftCatalog = Record<string, string>;

export type ChatStatus = "connecting" | "online" | "offline" | "not-configured" | "demo";

export type ChatHandlers = {
  onEvent: (event: ChatEvent) => void;
  onStatus: (status: ChatStatus) => void;
  /** Pessoas assistindo agora (channels/{cid}/stats/viewers). */
  onViewers: (viewers: number) => void;
  onGift?: (event: GiftEvent) => void;
  onCatalog?: (catalog: GiftCatalog) => void;
};

// Subconjunto do LiveEvent do Neon (packages/shared/src/index.ts no neon-live-labs).
type NeonLiveEvent = {
  type: string;
  comment?: string;
  platform?: string;
  user?: { uniqueId?: string; nickname?: string; avatar?: string; isModerator?: boolean };
  gift?: { giftId?: string; name?: string; image?: string };
  count?: number;
  streaking?: boolean;
};

const userOf = (event: NeonLiveEvent): ChatEvent["user"] => {
  const handle = event.user?.uniqueId || event.user?.nickname || "";
  return {
    id: `${event.platform ?? "tiktok"}:${handle}`,
    name: event.user?.nickname || handle,
    avatar: event.user?.avatar || undefined,
    handle: handle.toLowerCase(),
    isModerator: Boolean(event.user?.isModerator),
  };
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
  const { onEvent, onStatus, onViewers, onGift, onCatalog } = handlers;
  const config = neonConfig();
  // Combo do TikTok: chegam vários eventos com a contagem acumulada; só vale o que é novo.
  const streaks = new Map<string, number>();
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
      db.onValue(db.ref(rtdb, `channels/${cid}/gifts`), (snap) => {
        const catalog: GiftCatalog = {};
        for (const gift of Object.values(
          (snap.val() ?? {}) as Record<string, { name?: string; image?: string }>,
        )) {
          if (gift?.name && gift.image) catalog[gift.name.trim().toLowerCase()] = gift.image;
        }
        onCatalog?.(catalog);
      }),
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
        if (!event?.user) return;
        if (event.type === "gift" && event.gift?.name) {
          const user = userOf(event);
          const streakKey = `${user.id}:${event.gift.giftId ?? event.gift.name}`;
          const total = Math.max(1, Number(event.count) || 1);
          const seen = streaks.get(streakKey) ?? 0;
          const count = total > seen ? total - seen : total;
          if (event.streaking) streaks.set(streakKey, total);
          else streaks.delete(streakKey);
          onGift?.({
            key: child.key ?? "",
            user,
            gift: {
              id: event.gift.giftId ?? "",
              name: event.gift.name,
              image: event.gift.image || undefined,
            },
            count,
          });
          return;
        }
        if (event.type !== "chat" || !event.comment) return;
        onEvent({ key: child.key ?? "", comment: event.comment, user: userOf(event) });
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

/** Presentes que já apareceram no canal (para o painel sugerir). */
export async function loadGiftCatalog(cid: string): Promise<{ name: string; image: string }[]> {
  const config = neonConfig();
  if (!config) return [];
  const [{ getApps, initializeApp }, db] = await Promise.all([
    import("firebase/app"),
    import("firebase/database"),
  ]);
  const app = getApps().find((item) => item.name === "neon") ?? initializeApp(config, "neon");
  const snap = await db.get(db.ref(db.getDatabase(app), `channels/${cid}/gifts`));
  const gifts = Object.values(
    (snap.val() ?? {}) as Record<string, { name?: string; image?: string; diamonds?: number }>,
  );
  return gifts
    .filter((gift) => gift?.name)
    .sort((a, b) => (a.diamonds ?? 0) - (b.diamonds ?? 0))
    .map((gift) => ({ name: gift.name ?? "", image: gift.image ?? "" }));
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
export function connectDemoChat(
  getState: () => GameState | null,
  handlers: ChatHandlers,
  demoGifts: string[] = [],
) {
  const { onEvent, onStatus, onViewers, onGift } = handlers;
  onStatus("demo");
  onViewers(37);
  let count = 0;
  const timer = setInterval(() => {
    const state = getState();
    count += 1;
    if (count % 8 === 0) onViewers(30 + Math.floor(Math.random() * 25));
    const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
    // De vez em quando alguém manda presente (mais os baratos).
    if (onGift && demoGifts.length && state?.phase === "playing" && Math.random() < 0.09) {
      const index = Math.min(
        demoGifts.length - 1,
        Math.floor(demoGifts.length * Math.random() ** 2),
      );
      onGift({
        key: `demo-gift-${count}`,
        user: { id: `demo:${bot}`, name: bot, handle: bot, isModerator: false },
        gift: { id: `demo-${index}`, name: demoGifts[index] },
        count: index === 0 ? 1 + Math.floor(Math.random() * 4) : 1,
      });
      return;
    }
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
