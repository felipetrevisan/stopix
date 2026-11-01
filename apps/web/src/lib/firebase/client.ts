"use client";

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";

// Firebase do próprio Stopix (salas do modo amigos). O do Neon (chat da live) é outro
// app, iniciado em features/live/chat-source.ts.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";

export const firebaseConfigured = Boolean(config.apiKey && config.databaseURL && config.projectId);

export type FirebaseHandles = { app: FirebaseApp; db: Database; auth: Auth; uid: string };

let pending: Promise<FirebaseHandles> | null = null;

/** Abre o Firebase e entra anônimo (o uid fica guardado no navegador). */
export const getFirebase = (): Promise<FirebaseHandles> => {
  pending ??= (async () => {
    if (!firebaseConfigured) throw new Error("firebase-not-configured");
    const [{ getApps, initializeApp }, database, authModule] = await Promise.all([
      import("firebase/app"),
      import("firebase/database"),
      import("firebase/auth"),
    ]);
    const app = getApps().find((item) => item.name === "stopix") ?? initializeApp(config, "stopix");
    const db = database.getDatabase(app);
    const auth = authModule.getAuth(app);
    if (useEmulator) {
      database.connectDatabaseEmulator(db, "127.0.0.1", 9000);
      authModule.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    }
    await auth.authStateReady();
    const user = auth.currentUser ?? (await authModule.signInAnonymously(auth)).user;
    return { app, db, auth, uid: user.uid };
  })();
  pending.catch(() => {
    pending = null;
  });
  return pending;
};
