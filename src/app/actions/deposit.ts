"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { depositRequests, users } from "@/db/schema";
import { getBalance } from "@/lib/data";
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

function parseAmount(value: FormDataEntryValue | null): number | null {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isInteger(n) && n >= 1 && n <= MAX_DEPOSIT ? n : null;
}

export async function adjustBalance(_prev: FormState, formData: FormData): Promise<FormState> {
  const owner = await requireRole("owner");
  const userId = Number(formData.get("userId"));
  const direction = formData.get("direction");
  const amount = parseAmount(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  if (!Number.isInteger(userId) || userId <= 0) return { error: "Chưa chọn thành viên." };
  if (direction !== "credit" && direction !== "debit") return { error: "Không rõ thao tác." };
  if (!amount) return { error: "Nhập số tiền hợp lệ." };

  const [member] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!member) return { error: "Không tìm thấy thành viên." };

  await db.insert(depositRequests).values({
    userId,
    amount,
    kind: direction,
    status: "approved",
    note: note || (direction === "credit" ? "Chủ quán cộng tiền" : "Chủ quán trừ tiền"),
    reviewedById: owner.id,
    reviewedAt: new Date(),
  });
  refresh();
  return { success: direction === "credit" ? "Đã cộng tiền." : "Đã trừ tiền." };
}

export async function clearUserDebt(formData: FormData) {
  const owner = await requireRole("owner");
  const userId = Number(formData.get("userId"));
  if (!Number.isInteger(userId) || userId <= 0) return;
  const balance = await getBalance(userId);
  if (balance >= 0) return;

  await db.insert(depositRequests).values({
    userId,
    amount: -balance,
    kind: "credit",
    status: "approved",
    note: "Đã trả hết nợ",
    reviewedById: owner.id,
    reviewedAt: new Date(),
  });
  refresh();
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
