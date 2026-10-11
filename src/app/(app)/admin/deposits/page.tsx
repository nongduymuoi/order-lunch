import type { Metadata } from "next";
import { Suspense } from "react";
import { reviewDeposit } from "@/app/actions/deposit";
import { Badge } from "@/components/badges";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/page";
import { SubmitButton } from "@/components/submit-button";
import { requireRole } from "@/lib/auth";
import { getDepositQueue } from "@/lib/data";
import { formatVND } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Duyệt nạp tiền — Mộc" };

export default function AdminDepositsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DepositsContent />
    </Suspense>
  );
}

async function DepositsContent() {
  await requireRole("owner");
  const queue = await getDepositQueue();
  const pending = queue.filter((r) => r.status === "pending");
  const processed = queue.filter((r) => r.status !== "pending");

  return (
    <>
      <PageHeader
        eyebrow="Chủ quán"
        title="Duyệt nạp tiền"
        description="Kiểm tra đã nhận chuyển khoản rồi bấm duyệt. Số dư của thành viên được cộng ngay và tự trừ các đơn đang nợ."
      />

      <h2 className="mb-4 font-display text-2xl font-semibold text-navy-900">
        Chờ duyệt <span className="text-base font-normal text-muted">({pending.length})</span>
      </h2>
      {pending.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào đang chờ" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pending.map((r) => (
            <article key={r.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{r.userName}</p>
                  <p className="text-xs text-muted">
                    @{r.username} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <p className="font-display text-2xl font-semibold text-navy-900 tabular-nums">
                  {formatVND(r.amount)}
                </p>
              </div>
              {r.note && <p className="mt-3 rounded-xl bg-mist px-3 py-2 text-sm text-muted">“{r.note}”</p>}
              <form action={reviewDeposit} className="mt-5 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton name="decision" value="approved" className="btn-primary flex-1">
                  Duyệt &amp; cộng tiền
                </SubmitButton>
                <SubmitButton name="decision" value="rejected" className="btn-danger">
                  Từ chối
                </SubmitButton>
              </form>
            </article>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <section className="card mt-10 overflow-hidden">
          <h2 className="px-6 pt-5 pb-3 font-display text-xl font-semibold text-navy-900">Đã xử lý gần đây</h2>
          <ul className="divide-y divide-line border-t border-line">
            {processed.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{r.userName}</span>
                  <span className="ml-2 text-xs text-muted">
                    {r.reviewedAt ? formatDateTime(r.reviewedAt) : ""}
                    {r.reviewerName ? ` · bởi ${r.reviewerName}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatVND(r.amount)}</span>
                  {r.status === "approved" ? (
                    <Badge tone="green">Đã cộng</Badge>
                  ) : (
                    <Badge tone="red">Từ chối</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
