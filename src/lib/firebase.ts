import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function requireEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `${name} is not configured. Set it in your environment (local: .env.local, Vercel: Project Settings → Environment Variables), then redeploy.`
    );
  }
  return trimmed;
}

function getFirebaseConfig() {
  // NEXT_PUBLIC_* vars must be read with static property access so Next.js can
  // inline them into the client bundle at build time (process.env[name] does not work).
  return {
    apiKey: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    ),
    projectId: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    ),
    storageBucket: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    ),
    messagingSenderId: requireEnv(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    ),
    appId: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  };
}

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getClientAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function getClientDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

/** @deprecated Use getClientAuth() — lazy init avoids build failures without env vars */
export const auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getClientAuth(), prop, receiver);
  },
});

/** @deprecated Use getClientDb() — lazy init avoids build failures without env vars */
export const db = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    return Reflect.get(getClientDb(), prop, receiver);
  },
});

export default getFirebaseApp;
