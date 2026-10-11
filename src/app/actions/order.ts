"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { dayItems, days, menuItems, orderItems, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { applyComboPricing } from "@/lib/pricing";
import { isPast, todayISO } from "@/lib/time";

class OrderError extends Error {}

const MAX_QTY_PER_ITEM = 20;

export async function saveMyOrder(
  input: { dayItemId: number; quantity: number }[],
): Promise<FormState> {
  const user = await requireUser();

  const wanted = new Map<number, number>();
  for (const line of Array.isArray(input) ? input : []) {
    const id = Number(line?.dayItemId);
    const qty = Number(line?.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 0 || qty > MAX_QTY_PER_ITEM) {
      return { error: "Số lượng không hợp lệ." };
    }
    if (qty > 0) wanted.set(id, qty);
  }

  try {
    const message = await db.transaction(async (tx) => {
      // Khóa dòng của ngày để các lượt đặt cùng lúc chạy tuần tự, tránh vượt tồn kho.
      const [day] = await tx
        .select()
        .from(days)
        .where(eq(days.date, todayISO()))
        .for("update");
      if (!day) throw new OrderError("Hôm nay quán chưa mở menu.");
      if (day.isLocked) throw new OrderError("Đơn hôm nay đã được chốt, không thể thay đổi.");
      if (isPast(day.deadline)) throw new OrderError("Đã hết giờ chọn món.");

      const menu = await tx
        .select({
          dayItemId: dayItems.id,
          name: menuItems.name,
          category: menuItems.category,
          price: menuItems.price,
          stock: dayItems.stock,
          isSoldOut: dayItems.isSoldOut,
        })
        .from(dayItems)
        .innerJoin(menuItems, eq(menuItems.id, dayItems.menuItemId))
        .where(eq(dayItems.dayId, day.id));
      const menuById = new Map(menu.map((m) => [m.dayItemId, m]));

      const othersUsage = await tx
        .select({
          dayItemId: orderItems.dayItemId,
          qty: sql<number>`sum(${orderItems.quantity})::int`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(and(eq(orders.dayId, day.id), ne(orders.userId, user.id)))
        .groupBy(orderItems.dayItemId);
      const usedByOthers = new Map(othersUsage.map((u) => [u.dayItemId, u.qty]));

      const [existing] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.dayId, day.id), eq(orders.userId, user.id)));
      const previous = existing
        ? await tx
            .select({ dayItemId: orderItems.dayItemId, quantity: orderItems.quantity })
            .from(orderItems)
            .where(eq(orderItems.orderId, existing.id))
        : [];
      const previousQty = new Map(previous.map((p) => [p.dayItemId, p.quantity]));

      for (const [id, qty] of wanted) {
        const item = menuById.get(id);
        if (!item) throw new OrderError("Có món không còn trong menu hôm nay, vui lòng tải lại trang.");
        const prev = previousQty.get(id) ?? 0;
        if (qty <= prev) continue;
        if (item.isSoldOut) throw new OrderError(`${item.name} đã hết.`);
        if (item.stock !== null) {
          const available = item.stock - (usedByOthers.get(id) ?? 0);
          if (qty > available) {
            throw new OrderError(
              available > 0
                ? `${item.name} chỉ còn ${available} phần.`
                : `${item.name} đã hết.`,
            );
          }
        }
      }

      if (wanted.size === 0) {
        if (existing) await tx.delete(orders).where(eq(orders.id, existing.id));
        return existing ? "Đã hủy đơn hôm nay." : "Bạn chưa chọn món nào.";
      }

      const priced = applyComboPricing(
        [...wanted].map(([id, quantity]) => {
          const item = menuById.get(id)!;
          return { ...item, quantity };
        }),
      );

      let orderId: number;
      if (existing) {
        orderId = existing.id;
        await tx
          .update(orders)
          .set({ total: priced.total, updatedAt: new Date() })
          .where(eq(orders.id, orderId));
        await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
      } else {
        const [created] = await tx
          .insert(orders)
          .values({ dayId: day.id, userId: user.id, total: priced.total })
          .returning({ id: orders.id });
        orderId = created.id;
      }

      await tx.insert(orderItems).values(
        priced.lines.map((l) => ({
          orderId,
          dayItemId: l.dayItemId,
          name: l.name,
          category: l.category,
          unitPrice: l.price,
          finalUnitPrice: l.finalPrice,
          quantity: l.quantity,
        })),
      );
      return existing ? "Đã cập nhật đơn của bạn." : "Đã đặt món thành công.";
    });

    refresh();
    return { success: message };
  } catch (err) {
    if (err instanceof OrderError) return { error: err.message };
    throw err;
  }
}
