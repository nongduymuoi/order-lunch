import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dayItems,
  days,
  depositRequests,
  menuItems,
  orderItems,
  orders,
  users,
  type Category,
  type OrderKind,
} from "@/db/schema";
import { todayISO } from "./time";

export type Day = typeof days.$inferSelect;

export type OrderLine = {
  id: number;
  name: string;
  category: Category;
  unitPrice: number;
  finalUnitPrice: number;
  quantity: number;
};

export type OrderWithLines = {
  id: number;
  dayId: number;
  date: string;
  userId: number;
  kind: OrderKind;
  userName: string;
  avatarUrl: string | null;
  total: number;
  note: string | null;
  noteAckAt: Date | null;
  preparedAt: Date | null;
  updatedAt: Date;
  lines: OrderLine[];
};

export async function getDayByDate(dateISO: string): Promise<Day | null> {
  const [day] = await db.select().from(days).where(eq(days.date, dateISO)).limit(1);
  return day ?? null;
}

export function getToday(): Promise<Day | null> {
  return getDayByDate(todayISO());
}

export async function getTodayMenuItemIds(): Promise<number[]> {
  const day = await getToday();
  if (!day) return [];
  const rows = await db
    .select({ menuItemId: dayItems.menuItemId })
    .from(dayItems)
    .where(eq(dayItems.dayId, day.id));
  return rows.map((row) => row.menuItemId);
}

export type DayMenuItem = {
  dayItemId: number;
  menuItemId: number;
  name: string;
  category: Category;
  price: number;
  salePrice: number | null;
  description: string | null;
  stock: number | null;
  isSoldOut: boolean;
  orderedTotal: number;
  orderedLunch: number;
  orderedDrink: number;
};

export async function getDayMenu(dayId: number, userId: number): Promise<DayMenuItem[]> {
  const rows = await db
    .select({
      dayItemId: dayItems.id,
      menuItemId: menuItems.id,
      name: menuItems.name,
      category: menuItems.category,
      price: menuItems.price,
      salePrice: menuItems.salePrice,
      description: menuItems.description,
      stock: dayItems.stock,
      isSoldOut: dayItems.isSoldOut,
      orderedTotal: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      orderedLunch: sql<number>`coalesce(sum(case when ${orders.userId} = ${userId} and ${orders.kind} = 'lunch' then ${orderItems.quantity} end), 0)::int`,
      orderedDrink: sql<number>`coalesce(sum(case when ${orders.userId} = ${userId} and ${orders.kind} = 'drink' then ${orderItems.quantity} end), 0)::int`,
    })
    .from(dayItems)
    .innerJoin(menuItems, eq(menuItems.id, dayItems.menuItemId))
    .leftJoin(orderItems, eq(orderItems.dayItemId, dayItems.id))
    .leftJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(dayItems.dayId, dayId))
    .groupBy(dayItems.id, menuItems.id)
    .orderBy(asc(menuItems.category), asc(menuItems.name));
  return rows;
}

async function attachLines(
  rows: Omit<OrderWithLines, "lines">[],
): Promise<OrderWithLines[]> {
  if (rows.length === 0) return [];
  const lines = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      name: orderItems.name,
      category: orderItems.category,
      unitPrice: orderItems.unitPrice,
      finalUnitPrice: orderItems.finalUnitPrice,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    .orderBy(asc(orderItems.category), asc(orderItems.name));

  const byOrder = new Map<number, OrderLine[]>();
  for (const { orderId, ...line } of lines) {
    const list = byOrder.get(orderId) ?? [];
    list.push(line);
    byOrder.set(orderId, list);
  }
  return rows.map((r) => ({ ...r, lines: byOrder.get(r.id) ?? [] }));
}

const orderColumns = {
  id: orders.id,
  dayId: orders.dayId,
  date: days.date,
  userId: orders.userId,
  kind: orders.kind,
  userName: users.name,
  avatarUrl: users.avatarUrl,
  total: orders.total,
  note: orders.note,
  noteAckAt: orders.noteAckAt,
  preparedAt: orders.preparedAt,
  updatedAt: orders.updatedAt,
};

export async function getDayOrders(dayId: number, kind?: OrderKind): Promise<OrderWithLines[]> {
  const rows = await db
    .select(orderColumns)
    .from(orders)
    .innerJoin(days, eq(days.id, orders.dayId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(kind ? and(eq(orders.dayId, dayId), eq(orders.kind, kind)) : eq(orders.dayId, dayId))
    .orderBy(asc(orders.createdAt));
  return attachLines(rows);
}

export async function getUserOrders(userId: number): Promise<OrderWithLines[]> {
  const rows = await db
    .select(orderColumns)
    .from(orders)
    .innerJoin(days, eq(days.id, orders.dayId))
    .innerJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.userId, userId))
    .orderBy(desc(days.date));
  return attachLines(rows);
}

function signedDeposits() {
  return sql<number>`coalesce(sum(case when ${depositRequests.kind} = 'debit' then -${depositRequests.amount} else ${depositRequests.amount} end), 0)::int`;
}

export type PaymentStatus = "paid" | "partial" | "unpaid";

export type LedgerOrder = OrderWithLines & {
  paidAmount: number;
  status: PaymentStatus;
};

export type Ledger = {
  deposited: number;
  spent: number;
  balance: number;
  orders: LedgerOrder[];
};

/**
 * Tiền đã nạp được trừ dần vào các đơn theo thứ tự ngày (đơn cũ trả trước),
 * nên khi nạp thêm thì các đơn đang nợ tự chuyển sang đã thanh toán.
 */
export async function getLedger(userId: number): Promise<Ledger> {
  const [[{ deposited }], userOrders] = await Promise.all([
    db
      .select({
        deposited: signedDeposits(),
      })
      .from(depositRequests)
      .where(and(eq(depositRequests.userId, userId), eq(depositRequests.status, "approved"))),
    getUserOrders(userId),
  ]);

  let remaining = deposited;
  const ascending = [...userOrders].reverse().map((o) => {
    const paidAmount = Math.max(0, Math.min(o.total, remaining));
    remaining -= paidAmount;
    const status: PaymentStatus =
      paidAmount >= o.total ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
    return { ...o, paidAmount, status };
  });

  const spent = userOrders.reduce((s, o) => s + o.total, 0);
  return { deposited, spent, balance: deposited - spent, orders: ascending.reverse() };
}

export type MemberBalance = {
  id: number;
  username: string;
  name: string;
  role: (typeof users.$inferSelect)["role"];
  deposited: number;
  spent: number;
  balance: number;
};

export async function getMemberBalances(): Promise<MemberBalance[]> {
  const deposited = db
    .select({
      userId: depositRequests.userId,
      amount: signedDeposits().as("deposited_amount"),
    })
    .from(depositRequests)
    .where(eq(depositRequests.status, "approved"))
    .groupBy(depositRequests.userId)
    .as("dep");
  const spent = db
    .select({
      userId: orders.userId,
      amount: sql<number>`sum(${orders.total})`.as("spent_amount"),
    })
    .from(orders)
    .groupBy(orders.userId)
    .as("sp");

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      deposited: sql<number>`coalesce(${deposited.amount}, 0)::int`,
      spent: sql<number>`coalesce(${spent.amount}, 0)::int`,
    })
    .from(users)
    .leftJoin(deposited, eq(deposited.userId, users.id))
    .leftJoin(spent, eq(spent.userId, users.id))
    .orderBy(asc(users.name));

  return rows.map((r) => ({ ...r, balance: r.deposited - r.spent }));
}

export type DebtOrder = {
  id: number;
  date: string;
  owed: number;
  summary: string;
};

export type DebtMember = MemberBalance & {
  owed: number;
  orders: DebtOrder[];
};

/** Thành viên đang âm số dư, kèm các đơn FIFO chưa trả hết. */
export async function getDebtMembers(): Promise<{ members: MemberBalance[]; debtors: DebtMember[] }> {
  const members = await getMemberBalances();
  const debtors = await Promise.all(
    members
      .filter((m) => m.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .map(async (m) => {
        const ledger = await getLedger(m.id);
        const orders = ledger.orders
          .filter((o) => o.status !== "paid")
          .map((o) => ({
            id: o.id,
            date: o.date,
            owed: o.total - o.paidAmount,
            summary: `${o.kind === "drink" ? "Nước" : "Cơm trưa"}: ${o.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ")}`,
          }));
        return { ...m, owed: -m.balance, orders };
      }),
  );
  return { members, debtors };
}

export async function getBalance(userId: number): Promise<number> {
  const [row] = await db
    .select({
      deposited: sql<number>`coalesce((select sum(case when kind = 'debit' then -amount else amount end) from ${depositRequests} where user_id = ${userId} and status = 'approved'), 0)::int`,
      spent: sql<number>`coalesce((select sum(total) from ${orders} where user_id = ${userId}), 0)::int`,
    })
    .from(sql`(select 1) as one`);
  return row.deposited - row.spent;
}

export async function getUserDeposits(userId: number) {
  return db
    .select()
    .from(depositRequests)
    .where(eq(depositRequests.userId, userId))
    .orderBy(desc(depositRequests.createdAt))
    .limit(50);
}

export async function getDepositQueue() {
  const reviewer = sql<string | null>`(select name from ${users} r where r.id = ${depositRequests.reviewedById})`;
  return db
    .select({
      id: depositRequests.id,
      amount: depositRequests.amount,
      note: depositRequests.note,
      status: depositRequests.status,
      createdAt: depositRequests.createdAt,
      reviewedAt: depositRequests.reviewedAt,
      userName: users.name,
      username: users.username,
      reviewerName: reviewer,
    })
    .from(depositRequests)
    .innerJoin(users, eq(users.id, depositRequests.userId))
    .where(eq(depositRequests.kind, "deposit"))
    .orderBy(desc(depositRequests.createdAt))
    .limit(100);
}

export async function getMenuItems() {
  return db.select().from(menuItems).orderBy(asc(menuItems.category), asc(menuItems.name));
}
