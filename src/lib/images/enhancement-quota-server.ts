import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { getBusiness, updateBusiness } from "@/lib/firestore/collections";
import {
  currentEnhancementPeriod,
  IMAGE_ENHANCEMENTS_MONTHLY_LIMIT,
  resolveImageEnhancementQuota,
  type ImageEnhancementQuota,
} from "./enhancement-quota";

type ConsumeResult =
  | { ok: true; quota: ImageEnhancementQuota }
  | { ok: false; quota: ImageEnhancementQuota };

function quotaFromRecord(
  data: { imageEnhancementsUsed?: number; imageEnhancementsPeriod?: string } | undefined
): ImageEnhancementQuota {
  return resolveImageEnhancementQuota({
    used: data?.imageEnhancementsUsed,
    period: data?.imageEnhancementsPeriod,
  });
}

export async function getImageEnhancementQuota(userId: string): Promise<ImageEnhancementQuota> {
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection("businesses").doc(userId).get();
    return quotaFromRecord(snap.data());
  }

  const business = await getBusiness(userId);
  return quotaFromRecord(business);
}

export async function consumeImageEnhancementSlot(userId: string): Promise<ConsumeResult> {
  const period = currentEnhancementPeriod();
  const db = getAdminDb();

  if (db) {
    return db.runTransaction(async (tx) => {
      const ref = db.collection("businesses").doc(userId);
      const snap = await tx.get(ref);
      const quota = quotaFromRecord(snap.data());

      if (!quota.canEnhance) {
        return { ok: false, quota };
      }

      const used = quota.used + 1;
      tx.set(
        ref,
        {
          imageEnhancementsUsed: used,
          imageEnhancementsPeriod: period,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        ok: true,
        quota: resolveImageEnhancementQuota({ used, period }),
      };
    });
  }

  const business = await getBusiness(userId);
  const quota = quotaFromRecord(business);
  if (!quota.canEnhance) {
    return { ok: false, quota };
  }

  const used = quota.used + 1;
  await updateBusiness(userId, {
    imageEnhancementsUsed: used,
    imageEnhancementsPeriod: period,
  });

  return {
    ok: true,
    quota: resolveImageEnhancementQuota({ used, period }),
  };
}

export async function releaseImageEnhancementSlot(userId: string): Promise<void> {
  const period = currentEnhancementPeriod();
  const db = getAdminDb();

  if (db) {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("businesses").doc(userId);
      const snap = await tx.get(ref);
      const data = snap.data();
      if (data?.imageEnhancementsPeriod !== period) return;

      const used = Math.max(0, (data.imageEnhancementsUsed as number | undefined) ?? 0);
      if (used <= 0) return;

      tx.set(
        ref,
        {
          imageEnhancementsUsed: used - 1,
          imageEnhancementsPeriod: period,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    return;
  }

  const business = await getBusiness(userId);
  if (business.imageEnhancementsPeriod !== period) return;
  const used = Math.max(0, business.imageEnhancementsUsed ?? 0);
  if (used <= 0) return;

  await updateBusiness(userId, {
    imageEnhancementsUsed: used - 1,
    imageEnhancementsPeriod: period,
  });
}

export function quotaExceededStatus(quota: ImageEnhancementQuota) {
  return {
    error: quota.limitMessage ?? `Monthly limit of ${IMAGE_ENHANCEMENTS_MONTHLY_LIMIT} enhancements reached.`,
    quota,
  };
}
