import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "owner"]);
export const categoryEnum = pgEnum("menu_category", ["food", "drink"]);
export const depositStatusEnum = pgEnum("deposit_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  category: categoryEnum("category").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const days = pgTable("days", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  menuImageUrl: text("menu_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dayItems = pgTable(
  "day_items",
  {
    id: serial("id").primaryKey(),
    dayId: integer("day_id")
      .notNull()
      .references(() => days.id, { onDelete: "cascade" }),
    menuItemId: integer("menu_item_id")
      .notNull()
      .references(() => menuItems.id),
    // null = không giới hạn số lượng
    stock: integer("stock"),
    isSoldOut: boolean("is_sold_out").notNull().default(false),
  },
  (t) => [uniqueIndex("day_items_day_menu_idx").on(t.dayId, t.menuItemId)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    dayId: integer("day_id")
      .notNull()
      .references(() => days.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    total: integer("total").notNull(),
    note: text("note"),
    noteAckAt: timestamp("note_ack_at", { withTimezone: true }),
    noteAckById: integer("note_ack_by_id").references(() => users.id),
    preparedAt: timestamp("prepared_at", { withTimezone: true }),
    preparedById: integer("prepared_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_day_user_idx").on(t.dayId, t.userId),
    index("orders_user_idx").on(t.userId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    dayItemId: integer("day_item_id")
      .notNull()
      .references(() => dayItems.id),
    name: varchar("name", { length: 120 }).notNull(),
    category: categoryEnum("category").notNull(),
    unitPrice: integer("unit_price").notNull(),
    finalUnitPrice: integer("final_unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const depositRequests = pgTable(
  "deposit_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    note: text("note"),
    status: depositStatusEnum("status").notNull().default("pending"),
    reviewedById: integer("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("deposit_requests_user_idx").on(t.userId)],
);

export type Role = (typeof roleEnum.enumValues)[number];
export type Category = (typeof categoryEnum.enumValues)[number];
