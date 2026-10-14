import { togglePrepared } from "@/app/actions/admin";
import { Badge } from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderNote } from "@/components/order-note";
import { EmptyState, PageHeader } from "@/components/page";
import { SubmitButton } from "@/components/submit-button";
import { requireRole } from "@/lib/auth";
import { getDayOrders, getToday } from "@/lib/data";
import { formatVND } from "@/lib/format";
import { formatDate, todayISO, toHHMM } from "@/lib/time";
import type { OrderKind } from "@/db/schema";

const COPY = {
  lunch: {
    title: "Danh sách lấy cơm trưa",
    description: "Đơn đặt trước giờ chốt cơm. Bấm “Đã chuẩn bị” khi làm xong. Bấm dấu tích để xác nhận đã đọc ghi chú.",
    emptyDay: "Chưa có đơn cơm trưa để chuẩn bị.",
    emptyOrders: "Chưa ai đặt cơm trưa.",
  },
  drink: {
    title: "Danh sách lấy nước",
    description: "Nước đặt sau khi cơm đã chốt. Bấm “Đã chuẩn bị” khi làm xong. Bấm dấu tích để xác nhận đã đọc ghi chú.",
    emptyDay: "Chưa có đơn nước để chuẩn bị.",
    emptyOrders: "Chưa ai đặt nước sau giờ chốt.",
  },
} as const;

export async function PickupList({ kind }: { kind: OrderKind }) {
  await requireRole("staff", "admin", "owner");
  const copy = COPY[kind];
  const day = await getToday();

  if (!day) {
    return (
      <>
        <PageHeader eyebrow={formatDate(todayISO())} title={copy.title} />
        <EmptyState title="Hôm nay chưa mở menu">{copy.emptyDay}</EmptyState>
      </>
    );
  }

  const dayOrders = await getDayOrders(day.id, kind);
  const preparedCount = dayOrders.filter((o) => o.preparedAt).length;

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader
        eyebrow={formatDate(day.date)}
        title={copy.title}
        description={copy.description}
        actions={
          dayOrders.length > 0 ? (
            <Badge tone={preparedCount === dayOrders.length ? "green" : "blue"}>
              Đã chuẩn bị {preparedCount}/{dayOrders.length}
            </Badge>
          ) : undefined
        }
      />
      {dayOrders.length === 0 ? (
        <EmptyState title="Chưa có đơn">{copy.emptyOrders}</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {dayOrders.map((o) => {
            const prepared = Boolean(o.preparedAt);
            return (
              <li
                key={o.id}
                className={`rounded-2xl border p-4 shadow-card transition ${
                  prepared ? "border-emerald-200 bg-emerald-50" : "border-line bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`font-semibold ${prepared ? "text-emerald-800" : "text-ink"}`}>
                      {o.userName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{formatVND(o.total)}</span>
                </div>
                {o.note && (
                  <OrderNote orderId={o.id} note={o.note} acknowledged={Boolean(o.noteAckAt)} canAck />
                )}
                <form action={togglePrepared} className="mt-3 flex items-center justify-between gap-3">
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="prepared" value={prepared ? "false" : "true"} />
                  <span className="text-xs text-muted">
                    {o.preparedAt ? `Xong lúc ${toHHMM(o.preparedAt)}` : "Chưa chuẩn bị"}
                  </span>
                  <SubmitButton
                    className={
                      prepared
                        ? "btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
                        : "btn-ghost btn-sm"
                    }
                    pendingText="Đang lưu…"
                  >
                    {prepared ? "✓ Đã chuẩn bị" : "Đánh dấu đã chuẩn bị"}
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
