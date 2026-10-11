"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { dayItems, days, menuItems, orderItems, orders, type Category } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { readUploadedImage, removeStoredImage, storeImage } from "@/lib/storage";
import { deadlineAt, isValidHHMM, todayISO } from "@/lib/time";

const requireStaff = () => requireRole("admin", "owner");

function parseMoney(value: FormDataEntryValue | null): number | null {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isInteger(n) && n > 0 && n <= 10_000_000 ? n : null;
}

function parseCategory(value: FormDataEntryValue | null): Category | null {
  return value === "food" || value === "drink" ? value : null;
}

function parseId(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isForeignKeyViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23503" || e?.cause?.code === "23503";
}

// ---------- Menu ----------

export async function createMenuItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = parseCategory(formData.get("category"));
  const price = parseMoney(formData.get("price"));

  if (!name || name.length > 120) return { error: "Vui lòng nhập tên món." };
  if (!category) return { error: "Vui lòng chọn loại món." };
  if (!price) return { error: "Giá không hợp lệ." };

  await db.insert(menuItems).values({ name, category, price, description: description || null });
  refresh();
  return { success: `Đã thêm "${name}".` };
}

export async function updateMenuItem(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = parseMoney(formData.get("price"));
  if (!id || !name || !price) return;

  await db
    .update(menuItems)
    .set({ name: name.slice(0, 120), price, description: description || null })
    .where(eq(menuItems.id, id));
  refresh();
}

export async function toggleMenuItem(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  await db
    .update(menuItems)
    .set({ isActive: sql`not ${menuItems.isActive}` })
    .where(eq(menuItems.id, id));
  refresh();
}

export async function deleteMenuItem(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  try {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  } catch (err) {
    // Món đã từng xuất hiện trong menu ngày thì giữ lại lịch sử, chỉ ẩn đi.
    if (!isForeignKeyViolation(err)) throw err;
    await db.update(menuItems).set({ isActive: false }).where(eq(menuItems.id, id));
  }
  refresh();
}

// ---------- Menu hôm nay ----------

export async function openToday(formData: FormData) {
  await requireStaff();
  const time = String(formData.get("deadline") ?? "");
  if (!isValidHHMM(time)) return;
  const date = todayISO();

  await db.transaction(async (tx) => {
    const [day] = await tx
      .insert(days)
      .values({ date, deadline: deadlineAt(date, time) })
      .onConflictDoNothing({ target: days.date })
      .returning({ id: days.id });
    if (!day) return;
    const active = await tx
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.isActive, true));
    if (active.length > 0) {
      await tx.insert(dayItems).values(active.map((m) => ({ dayId: day.id, menuItemId: m.id })));
    }
  });
  refresh();
}

export async function setDeadline(formData: FormData) {
  await requireStaff();
  const dayId = parseId(formData.get("dayId"));
  const time = String(formData.get("deadline") ?? "");
  if (!dayId || !isValidHHMM(time)) return;
  const [day] = await db.select({ date: days.date }).from(days).where(eq(days.id, dayId));
  if (!day) return;
  await db.update(days).set({ deadline: deadlineAt(day.date, time) }).where(eq(days.id, dayId));
  refresh();
}

export async function setDayLocked(formData: FormData) {
  await requireStaff();
  const dayId = parseId(formData.get("dayId"));
  const locked = formData.get("locked") === "true";
  if (!dayId) return;
  await db
    .update(days)
    .set({ isLocked: locked, lockedAt: locked ? new Date() : null })
    .where(eq(days.id, dayId));
  refresh();
}

export async function updateDayItemStock(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  const raw = String(formData.get("stock") ?? "").trim();
  if (!id) return;
  const stock = raw === "" ? null : Number(raw);
  if (stock !== null && (!Number.isInteger(stock) || stock < 0 || stock > 10_000)) return;
  await db.update(dayItems).set({ stock }).where(eq(dayItems.id, id));
  refresh();
}

export async function toggleSoldOut(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  await db
    .update(dayItems)
    .set({ isSoldOut: sql`not ${dayItems.isSoldOut}` })
    .where(eq(dayItems.id, id));
  refresh();
}

export async function addDayItem(formData: FormData) {
  await requireStaff();
  const dayId = parseId(formData.get("dayId"));
  const menuItemId = parseId(formData.get("menuItemId"));
  if (!dayId || !menuItemId) return;
  await db.insert(dayItems).values({ dayId, menuItemId }).onConflictDoNothing();
  refresh();
}

export async function removeDayItem(formData: FormData) {
  await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  const [used] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.dayItemId, id))
    .limit(1);
  // Món đã có người đặt thì chỉ được đánh dấu hết, không gỡ khỏi menu.
  if (used) {
    await db.update(dayItems).set({ isSoldOut: true }).where(and(eq(dayItems.id, id)));
  } else {
    await db.delete(dayItems).where(eq(dayItems.id, id));
  }
  refresh();
}

// ---------- Ảnh menu món ăn trong ngày ----------

export async function setDayMenuImage(formData: FormData): Promise<FormState> {
  await requireStaff();
  const dayId = parseId(formData.get("dayId"));
  const image = await readUploadedImage(formData.get("file"));
  if (!dayId) return { error: "Không tìm thấy ngày." };
  if ("error" in image) return image;

  const [day] = await db
    .select({ menuImageUrl: days.menuImageUrl })
    .from(days)
    .where(eq(days.id, dayId));
  if (!day) return { error: "Không tìm thấy ngày." };

  const url = await storeImage("menus", image.data, image.type);
  await db.update(days).set({ menuImageUrl: url }).where(eq(days.id, dayId));
  await removeStoredImage(day.menuImageUrl);
  refresh();
  return { success: "Đã cập nhật ảnh menu món ăn." };
}

export async function clearDayMenuImage(formData: FormData) {
  await requireStaff();
  const dayId = parseId(formData.get("dayId"));
  if (!dayId) return;
  const [day] = await db
    .select({ menuImageUrl: days.menuImageUrl })
    .from(days)
    .where(eq(days.id, dayId));
  if (!day) return;
  await db.update(days).set({ menuImageUrl: null }).where(eq(days.id, dayId));
  await removeStoredImage(day.menuImageUrl);
  refresh();
}

// ---------- Đơn của khách ----------

export async function toggleNoteAck(formData: FormData) {
  const staff = await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  const ack = formData.get("ack") === "true";
  await db
    .update(orders)
    .set(ack ? { noteAckAt: new Date(), noteAckById: staff.id } : { noteAckAt: null, noteAckById: null })
    .where(eq(orders.id, id));
  refresh();
}

export async function togglePrepared(formData: FormData) {
  const staff = await requireStaff();
  const id = parseId(formData.get("id"));
  if (!id) return;
  const prepared = formData.get("prepared") === "true";
  await db
    .update(orders)
    .set(
      prepared
        ? { preparedAt: new Date(), preparedById: staff.id }
        : { preparedAt: null, preparedById: null },
    )
    .where(eq(orders.id, id));
  refresh();
}
