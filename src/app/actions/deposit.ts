"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { depositRequests } from "@/db/schema";
import { requireRole, requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { transferContent } from "@/lib/text";

const MAX_DEPOSIT = 50_000_000;

export async function requestDeposit(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d]/g, ""));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  if (!Number.isInteger(amount) || amount < 1000) {
    return { error: "Số tiền nạp tối thiểu 1.000đ." };
  }
  if (amount > MAX_DEPOSIT) return { error: "Số tiền quá lớn." };

  await db
    .insert(depositRequests)
    .values({ userId: user.id, amount, note: note || transferContent(user.name) });
  refresh();
  return { success: "Đã gửi yêu cầu nạp tiền. Chờ admin xác nhận." };
}

export async function reviewDeposit(formData: FormData) {
  const owner = await requireRole("owner");
  const id = Number(formData.get("id"));
  const decision = formData.get("decision");
  if (!Number.isInteger(id) || (decision !== "approved" && decision !== "rejected")) return;

  await db
    .update(depositRequests)
    .set({ status: decision, reviewedById: owner.id, reviewedAt: new Date() })
    .where(and(eq(depositRequests.id, id), eq(depositRequests.status, "pending")));
  refresh();
}
