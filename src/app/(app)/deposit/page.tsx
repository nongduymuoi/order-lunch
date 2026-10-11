import type { Metadata } from "next";
import { Suspense } from "react";
import { BalanceValue, Badge } from "@/components/badges";
import { PageHeader, PageSkeleton } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { getBankAccount } from "@/lib/bank";
import { getBalance, getUserDeposits } from "@/lib/data";
import { formatVND } from "@/lib/format";
import { transferContent } from "@/lib/text";
import { formatDateTime } from "@/lib/time";
import { DepositForm } from "./deposit-form";

export const metadata: Metadata = { title: "Nạp tiền — Mộc" };

const STATUS = {
  pending: { label: "Đang chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "green" },
  rejected: { label: "Từ chối", tone: "red" },
} as const;

export default function DepositPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DepositContent />
    </Suspense>
  );
}

async function DepositContent() {
  const user = await requireUser();
  const [balance, requests] = await Promise.all([getBalance(user.id), getUserDeposits(user.id)]);
  const pendingTotal = requests
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.amount, 0);
  const approvedTotal = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Ví của bạn"
        title="Nạp tiền"
        description="Quét mã QR để chuyển khoản, rồi gửi yêu cầu tại đây. Số dư được cộng ngay khi admin duyệt."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-7 text-white shadow-lift">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgb(58_108_240/0.5),transparent_60%)]" />
            <div className="relative">
              <p className="eyebrow !text-royal-200/70">Số dư khả dụng</p>
              <p className="mt-3 font-display text-4xl font-semibold">
                <BalanceValue amount={balance} className={balance < 0 ? "!text-rose-300" : "!text-white"} />
              </p>
              {pendingTotal > 0 && (
                <p className="mt-3 text-sm text-royal-100/70">
                  Đang chờ duyệt: <span className="font-semibold text-white">{formatVND(pendingTotal)}</span>
                </p>
              )}
              {balance < 0 && (
                <p className="mt-3 text-sm text-rose-200">Bạn đang nợ {formatVND(-balance)}.</p>
              )}
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-5 font-display text-xl font-semibold text-navy-900">Yêu cầu nạp tiền</h2>
            <DepositForm bank={getBankAccount()} content={transferContent(user.name)} />
          </section>
        </div>

        <section className="card p-6 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-navy-900">Lịch sử nạp tiền</h2>
            {approvedTotal > 0 && (
              <span className="text-xs text-muted">
                Tổng đã duyệt: <span className="font-semibold text-emerald-700">{formatVND(approvedTotal)}</span>
              </span>
            )}
          </div>
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Bạn chưa gửi yêu cầu nạp nào.</p>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 tabular-nums">{formatVND(r.amount)}</p>
                    <p className="truncate text-xs text-muted">
                      Gửi lúc {formatDateTime(r.createdAt)}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                    {r.reviewedAt && (
                      <p className="text-xs text-muted">
                        {r.status === "approved" ? "Duyệt" : "Từ chối"} lúc {formatDateTime(r.reviewedAt)}
                      </p>
                    )}
                  </div>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
