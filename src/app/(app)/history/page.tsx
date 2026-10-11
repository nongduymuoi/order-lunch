import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentBadge } from "@/components/badges";
import { OrderLines } from "@/components/order-lines";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { getLedger } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch sử đơn — Mộc" };

export default function HistoryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
  const user = await requireUser();
  const { orders } = await getLedger(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Đơn của bạn"
        title="Lịch sử đặt cơm"
        description="Toàn bộ các đơn bạn đã đặt, mới nhất ở trên cùng."
      />
      {orders.length === 0 ? (
        <EmptyState title="Chưa có đơn nào">Các đơn bạn đặt sẽ xuất hiện ở đây.</EmptyState>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="card p-6">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-navy-900 capitalize">
                    {formatDate(o.date)}
                  </p>
                  <p className="text-xs text-muted">Cập nhật lúc {formatDateTime(o.updatedAt)}</p>
                </div>
                <PaymentBadge status={o.status} owed={o.total - o.paidAmount} />
              </div>
              <OrderLines lines={o.lines} total={o.total} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
