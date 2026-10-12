import type { Metadata } from "next";
import { Suspense } from "react";
import { BalanceValue } from "@/components/badges";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getDebtMembers } from "@/lib/data";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/time";
import { AdjustForm } from "./adjust-form";
import { ClearDebtButton } from "./clear-debt-button";

export const metadata: Metadata = { title: "Quản lý nợ — Mộc" };

export default function DebtsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DebtsContent />
    </Suspense>
  );
}

async function DebtsContent() {
  await requireRole("owner");
  const { members, debtors } = await getDebtMembers();
  const totalOwed = debtors.reduce((sum, m) => sum + m.owed, 0);

  return (
    <>
      <PageHeader
        eyebrow="Chủ quán"
        title="Quản lý nợ"
        description="Xem từng đơn còn thiếu của thành viên. Đánh dấu đã trả để xóa hết nợ, hoặc tự cộng và trừ tiền."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow">Người đang nợ</p>
          <p className="mt-2 font-display text-3xl font-semibold text-navy-900 tabular-nums">{debtors.length}</p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">Tổng nợ</p>
          <p className="mt-2 font-display text-3xl font-semibold text-rose-600 tabular-nums">{formatVND(totalOwed)}</p>
        </div>
      </div>

      <AdjustForm members={members.map((m) => ({ id: m.id, name: m.name, username: m.username }))} />

      <h2 className="mt-10 mb-4 font-display text-2xl font-semibold text-navy-900">Nợ theo đơn</h2>
      {debtors.length === 0 ? (
        <EmptyState title="Không ai đang nợ">Mọi thành viên đều không âm số dư.</EmptyState>
      ) : (
        <div className="space-y-4">
          {debtors.map((m) => (
            <article key={m.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-semibold text-navy-900">{m.name}</p>
                  <p className="text-sm text-muted">@{m.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Còn nợ</p>
                  <p className="font-display text-2xl font-semibold">
                    <BalanceValue amount={m.balance} />
                  </p>
                </div>
              </div>

              {m.orders.length > 0 ? (
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                  {m.orders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink capitalize">{formatDate(o.date)}</p>
                        <p className="truncate text-muted">{o.summary}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-rose-700 tabular-nums">
                        Thiếu {formatVND(o.owed)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">Nợ này đến từ khoản trừ tiền, không gắn với một đơn cụ thể.</p>
              )}

              <div className="mt-4">
                <ClearDebtButton userId={m.id} owedLabel={m.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
