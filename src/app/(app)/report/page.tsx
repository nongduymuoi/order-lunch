import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BalanceValue, PaymentBadge } from "@/components/badges";
import { OrderLines } from "@/components/order-lines";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/page";
import { isStaff, requireUser } from "@/lib/auth";
import { getLedger, getMemberBalances, type MemberBalance } from "@/lib/data";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Báo cáo chi tiêu — Mộc" };

export default function ReportPage({ searchParams }: PageProps<"/report">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportContent({ searchParams }: { searchParams: PageProps<"/report">["searchParams"] }) {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const members = staff ? (await getMemberBalances()).filter((m) => m.role === "user") : [];

  const requested = Number((await searchParams).user);
  const target: { id: number; name: string } =
    staff && Number.isInteger(requested)
      ? (members.find((m) => m.id === requested) ?? user)
      : user;

  const ledger = await getLedger(target.id);
  const unpaid = ledger.orders.filter((o) => o.status !== "paid");
  const owed = unpaid.reduce((s, o) => s + o.total - o.paidAmount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Báo cáo chi tiêu"
        title={target.id === user.id ? "Chi tiêu của bạn" : target.name}
        description="Tiền nạp được tự động trừ vào các đơn theo thứ tự ngày. Số dư âm nghĩa là còn nợ quán."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Số dư hiện tại" highlight>
          <BalanceValue amount={ledger.balance} />
        </SummaryCard>
        <SummaryCard label="Đã nạp">{formatVND(ledger.deposited)}</SummaryCard>
        <SummaryCard label="Đã chi">{formatVND(ledger.spent)}</SummaryCard>
        <SummaryCard label="Đơn chưa thanh toán">
          <span className={unpaid.length ? "text-rose-600" : ""}>
            {unpaid.length}
            {owed > 0 && <span className="ml-2 text-sm font-medium">({formatVND(owed)})</span>}
          </span>
        </SummaryCard>
      </div>

      {staff && <MemberTable members={members} selectedId={target.id} />}

      {unpaid.length > 0 && (
        <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-6">
          <h2 className="font-display text-xl font-semibold text-rose-800">Đơn chưa thanh toán</h2>
          <p className="mt-1 text-sm text-rose-700/80">
            Nạp thêm {formatVND(owed)} để thanh toán hết các đơn này.
          </p>
          <ul className="mt-4 divide-y divide-rose-200/70">
            {unpaid.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-rose-900 capitalize">{formatDate(o.date)}</span>
                <span className="font-semibold text-rose-700 tabular-nums">
                  Còn thiếu {formatVND(o.total - o.paidAmount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-4 font-display text-2xl font-semibold text-navy-900">Chi tiết theo ngày</h2>
      {ledger.orders.length === 0 ? (
        <EmptyState title="Chưa có đơn nào" />
      ) : (
        <div className="space-y-4">
          {ledger.orders.map((o) => (
            <details key={o.id} className="card group p-0 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-muted transition group-open:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-medium text-ink capitalize">{formatDate(o.date)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-navy-900 tabular-nums">{formatVND(o.total)}</span>
                  <PaymentBadge status={o.status} owed={o.total - o.paidAmount} />
                </div>
              </summary>
              <div className="border-t border-line px-6 py-4">
                <OrderLines lines={o.lines} total={o.total} />
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}

function SummaryCard({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-5 ${highlight ? "bg-gradient-to-br from-white to-royal-50" : ""}`}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-navy-900 tabular-nums">{children}</p>
    </div>
  );
}

function MemberTable({ members, selectedId }: { members: MemberBalance[]; selectedId: number }) {
  return (
    <section className="card mb-8 overflow-hidden">
      <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
        <h2 className="font-display text-xl font-semibold text-navy-900">Thành viên</h2>
        <span className="text-xs text-muted">Chọn một người để xem báo cáo</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-mist text-left text-xs text-muted">
            <tr>
              <th className="px-6 py-2 font-semibold">Tên</th>
              <th className="px-3 py-2 text-right font-semibold">Đã nạp</th>
              <th className="px-3 py-2 text-right font-semibold">Đã chi</th>
              <th className="px-6 py-2 text-right font-semibold">Số dư</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m.id} className={m.id === selectedId ? "bg-royal-50/70" : "hover:bg-mist/60"}>
                <td className="px-6 py-2.5">
                  <Link href={`/report?user=${m.id}`} className="font-medium text-ink hover:text-royal-600">
                    {m.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted">@{m.username}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatVND(m.deposited)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatVND(m.spent)}</td>
                <td className="px-6 py-2.5 text-right font-semibold">
                  <BalanceValue amount={m.balance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
