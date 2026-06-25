import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase-admin";

export type StripeLogStatus =
  | "received"
  | "processed"
  | "skipped"
  | "error"
  | "signature_invalid";

export interface StripeLogMeta {
  firebaseUid?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  checkoutSessionId?: string | null;
  handlerAction?: string;
  handlerResult?: string | boolean;
  error?: string;
}

const COLLECTION = "stripeLogs";

/** Persist a failed signature verification attempt (no Stripe event id available). */
export async function logStripeSignatureFailure(
  error: unknown,
  rawBodyLength?: number
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  await db.collection(COLLECTION).add({
    status: "signature_invalid" satisfies StripeLogStatus,
    error: error instanceof Error ? error.message : String(error),
    rawBodyLength: rawBodyLength ?? null,
    receivedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Store or update a Stripe webhook event in Firestore (`stripeLogs` collection).
 * Uses Stripe's event id as the document id so retries update the same record.
 */
export async function saveStripeLog(
  event: Stripe.Event,
  status: Exclude<StripeLogStatus, "signature_invalid">,
  meta: StripeLogMeta = {}
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const record: Record<string, unknown> = {
    eventId: event.id,
    type: event.type,
    created: event.created,
    livemode: event.livemode,
    apiVersion: event.api_version ?? null,
    status,
    payload: JSON.parse(JSON.stringify(event)),
    firebaseUid: meta.firebaseUid ?? null,
    stripeCustomerId: meta.stripeCustomerId ?? null,
    stripeSubscriptionId: meta.stripeSubscriptionId ?? null,
    checkoutSessionId: meta.checkoutSessionId ?? null,
    handlerAction: meta.handlerAction ?? null,
    handlerResult: meta.handlerResult ?? null,
    error: meta.error ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === "received") {
    record.receivedAt = FieldValue.serverTimestamp();
  }

  await db.collection(COLLECTION).doc(event.id).set(record, { merge: true });
}

/** Persist a checkout API failure (before Stripe redirects the user). */
export async function logStripeCheckoutError(input: {
  firebaseUid?: string;
  quantity?: number;
  stripeCustomerId?: string | null;
  error: unknown;
}): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const message =
    input.error instanceof Error ? input.error.message : String(input.error);
  const stripeCode =
    input.error instanceof Error && "code" in input.error
      ? String((input.error as { code?: string }).code ?? "")
      : null;

  await db.collection(COLLECTION).add({
    type: "checkout.error",
    status: "error" satisfies StripeLogStatus,
    firebaseUid: input.firebaseUid ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    quantity: input.quantity ?? null,
    error: message,
    stripeCode,
    receivedAt: FieldValue.serverTimestamp(),
  });
}
