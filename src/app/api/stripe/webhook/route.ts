import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { grantPaidBusinessSlot, updateSubscriptionStatus } from "@/lib/firebase-admin";
import {
  logStripeSignatureFailure,
  saveStripeLog,
  type StripeLogMeta,
} from "@/lib/stripe/logs";

export const runtime = "nodejs";
// Stripe needs the raw, unparsed request body to verify the signature.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  let rawBody = "";
  try {
    rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    await logStripeSignatureFailure(error, rawBody.length);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  await saveStripeLog(event, "received");

  try {
    let meta: StripeLogMeta = { handlerAction: event.type };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid =
          (session.metadata?.firebaseUid as string | undefined) ??
          (session.client_reference_id ?? undefined);

        meta = {
          handlerAction: event.type,
          firebaseUid: uid ?? null,
          checkoutSessionId: session.id,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        };

        if (uid) {
          const slotCount = Math.max(
            1,
            parseInt(session.metadata?.businessQuantity ?? "1", 10) || 1
          );
          const granted = await grantPaidBusinessSlot(uid, {
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : null,
            subscriptionStatus: "active",
            checkoutSessionId: session.id,
            slotCount,
          });
          meta.handlerResult = granted ? "slots_granted" : "already_processed";
        } else {
          console.warn("checkout.session.completed without firebaseUid:", session.id);
          meta.handlerResult = "skipped_no_uid";
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;
        meta = {
          handlerAction: event.type,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        };
        if (customerId) {
          await updateSubscriptionStatus(customerId, subscription.status, {
            downgrade: true,
          });
          meta.handlerResult = "downgraded";
        } else {
          meta.handlerResult = "skipped_no_customer";
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;
        meta = {
          handlerAction: event.type,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        };
        if (customerId) {
          await updateSubscriptionStatus(customerId, subscription.status);
          meta.handlerResult = "status_updated";
        } else {
          meta.handlerResult = "skipped_no_customer";
        }
        break;
      }

      default:
        meta = { handlerAction: event.type, handlerResult: "unhandled" };
        break;
    }

    await saveStripeLog(event, "processed", meta);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    await saveStripeLog(event, "error", {
      handlerAction: event.type,
      error: error instanceof Error ? error.message : "Webhook handler failed",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}
