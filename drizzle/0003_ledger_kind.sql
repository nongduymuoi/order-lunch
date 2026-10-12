CREATE TYPE "public"."ledger_kind" AS ENUM('deposit', 'credit', 'debit');--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "kind" "ledger_kind" DEFAULT 'deposit' NOT NULL;