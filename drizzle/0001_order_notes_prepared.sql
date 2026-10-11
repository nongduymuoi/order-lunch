ALTER TABLE "orders" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note_ack_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note_ack_by_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "prepared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "prepared_by_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_note_ack_by_id_users_id_fk" FOREIGN KEY ("note_ack_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_prepared_by_id_users_id_fk" FOREIGN KEY ("prepared_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;