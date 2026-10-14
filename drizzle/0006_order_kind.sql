CREATE TYPE "public"."order_kind" AS ENUM('lunch', 'drink');--> statement-breakpoint
DROP INDEX "orders_day_user_idx";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "kind" "order_kind" DEFAULT 'lunch' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_day_user_kind_idx" ON "orders" USING btree ("day_id","user_id","kind");