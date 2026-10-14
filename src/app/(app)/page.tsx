import { Suspense } from "react";
import { AutoRefresh } from "@/components/auto-refresh";
import { PaymentBadge } from "@/components/badges";
import { Countdown } from "@/components/countdown";
import { OrderLines } from "@/components/order-lines";
import { MenuPoster } from "@/components/menu-poster";
import { UserAvatar } from "@/components/user-avatar";
import { OrderNote } from "@/components/order-note";
import { EmptyState, PageSkeleton } from "@/components/page";
import { canPrepareOrders, isStaff, requireUser } from "@/lib/auth";
import { getDayMenu, getDayOrders, getLedger, getToday } from "@/lib/data";
import { FOOD_CLOSED_MESSAGE, ORDER_KIND_LABEL, formatVND } from "@/lib/format";
import { formatDate, isPast, todayISO, toHHMM } from "@/lib/time";
import { OrderBuilder, type BuilderItem } from "./order-builder";

export default function TodayPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TodayContent />
    </Suspense>
  );
}

async function TodayContent() {
  const user = await requireUser();
  const day = await getToday();

  if (!day) {
    return (
      <>
        <TodayHeading date={todayISO()} />
        <EmptyState title="Hôm nay quán chưa mở menu">
          {isStaff(user.role) ? (
            <>
              Vào{" "}
              <a href="/admin/today" className="font-semibold text-royal-600">
                Quản lý menu hôm nay
              </a>{" "}
              để mở menu và đặt giờ chốt.
            </>
          ) : (
            "Quay lại sau ít phút nhé — menu sẽ xuất hiện khi chủ quán mở đơn."
          )}
        </EmptyState>
        <AutoRefresh seconds={30} />
      </>
    );
  }

  const [menu, dayOrders, ledger] = await Promise.all([
    getDayMenu(day.id, user.id),
    getDayOrders(day.id),
    getLedger(user.id),
  ]);

  const foodClosed = day.isLocked || isPast(day.deadline);

  const items: BuilderItem[] = menu.map((m) => {
    const mine = foodClosed ? m.orderedDrink : m.orderedLunch;
    return {
      dayItemId: m.dayItemId,
      name: m.name,
      category: m.category,
      price: m.price,
      salePrice: m.salePrice,
      description: m.description,
      isSoldOut: m.isSoldOut,
      savedQty: mine,
      // Số phần tối đa của đơn đang sửa = tồn kho trừ phần thuộc đơn khác.
      maxForMe: m.stock === null ? null : Math.max(0, m.stock - (m.orderedTotal - mine)),
    };
  });

  const myOrders = ledger.orders
    .filter((o) => o.dayId === day.id)
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "lunch" ? -1 : 1));
  const activeOrder = foodClosed
    ? myOrders.find((o) => o.kind === "drink")
    : myOrders.find((o) => o.kind === "lunch");
  const staff = canPrepareOrders(user.role);
  const portions = dayOrders.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.quantity, 0), 0);
  const people = new Set(dayOrders.map((o) => o.userId)).size;
  const myTotal = myOrders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <AutoRefresh />
      <TodayHeading date={day.date} />

      <section className="relative mb-8 overflow-hidden rounded-3xl bg-navy-900 px-6 py-7 text-white shadow-lift sm:px-10 sm:py-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgb(232_184_92/0.28),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgb(45_125_93/0.4),transparent_50%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow mb-3 !text-royal-200/70">
              {foodClosed ? "Cơm đã chốt · nước vẫn mở" : `Chốt cơm lúc ${toHHMM(day.deadline)}`}
            </p>
            {foodClosed ? (
              <p className="max-w-xl font-display text-2xl leading-snug font-semibold sm:text-3xl">
                {FOOD_CLOSED_MESSAGE}
              </p>
            ) : (
              <Countdown deadline={day.deadline.toISOString()} />
            )}
          </div>
          <dl className="flex gap-8 sm:gap-12">
            <Stat label="Người đã đặt" value={String(people)} />
            <Stat label="Tổng phần" value={String(portions)} />
            <Stat label="Đơn của bạn" value={myOrders.length > 0 ? formatVND(myTotal) : "—"} />
          </dl>
        </div>
      </section>

      <MenuPosters foodUrl={day.menuImageUrl} drinkUrl={day.drinkMenuImageUrl} />

      {items.length === 0 ? (
        <EmptyState title="Menu hôm nay đang trống">Chủ quán chưa thêm món nào.</EmptyState>
      ) : (
        <OrderBuilder
          items={items}
          foodClosed={foodClosed}
          savedNote={activeOrder?.note ?? ""}
          noteAcknowledged={Boolean(activeOrder?.noteAckAt)}
        />
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-navy-900">Mọi người đã chọn</h2>
            <span className="text-xs text-muted">{dayOrders.length} đơn</span>
          </div>
          {dayOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Chưa có ai đặt. Bạn là người đầu tiên?</p>
          ) : (
            <ul className="divide-y divide-line">
              {dayOrders.map((o) => (
                <li key={o.id} className="flex items-start gap-3 py-3">
                  <UserAvatar
                    name={o.userName}
                    url={o.avatarUrl}
                    className={`size-9 shrink-0 rounded-full text-xs ${
                      o.userId === user.id
                        ? "bg-royal-600 text-white ring-2 ring-royal-600"
                        : "bg-royal-50 text-royal-700 ring-1 ring-royal-100"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {o.userName}
                      {o.userId === user.id && <span className="ml-2 text-xs font-medium text-royal-600">(bạn)</span>}
                      <span className="ml-2 text-xs font-medium text-muted">{ORDER_KIND_LABEL[o.kind]}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ")}
                    </p>
                    {o.note && (
                      <OrderNote
                        orderId={o.id}
                        note={o.note}
                        acknowledged={Boolean(o.noteAckAt)}
                        canAck={staff}
                      />
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-navy-800 tabular-nums">
                    {formatVND(o.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-navy-900">Chi tiết đơn của bạn</h2>
          </div>
          {myOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Bạn chưa đặt món hôm nay.</p>
          ) : (
            <div className="space-y-6">
              {myOrders.map((order) => (
                <div key={order.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-navy-800">{ORDER_KIND_LABEL[order.kind]}</h3>
                    <PaymentBadge status={order.status} owed={order.total - order.paidAmount} />
                  </div>
                  {order.preparedAt && (
                    <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      ✓ Quán đã chuẩn bị xong
                    </p>
                  )}
                  <OrderLines lines={order.lines} total={order.total} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function MenuPosters({ foodUrl, drinkUrl }: { foodUrl: string | null; drinkUrl: string | null }) {
  const posters = [
    foodUrl ? { src: foodUrl, alt: "Menu cơm hôm nay", caption: "Menu cơm" } : null,
    drinkUrl ? { src: drinkUrl, alt: "Menu nước hôm nay", caption: "Menu nước" } : null,
  ].filter((poster) => poster !== null);
  if (posters.length === 0) return null;

  return (
    <div className={`mb-8 grid gap-4 ${posters.length > 1 ? "md:grid-cols-2" : ""}`}>
      {posters.map((poster) => (
        <figure key={poster.caption}>
          <figcaption className="eyebrow mb-2">{poster.caption}</figcaption>
          <MenuPoster src={poster.src} alt={poster.alt} />
        </figure>
      ))}
    </div>
  );
}

function TodayHeading({ date }: { date: string }) {
  return (
    <header className="mb-6">
      <p className="eyebrow mb-2">{formatDate(date)}</p>
      <h1 className="font-display text-3xl font-semibold text-navy-900 sm:text-4xl">Thực đơn hôm nay</h1>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] tracking-[0.18em] text-royal-200/60 uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

