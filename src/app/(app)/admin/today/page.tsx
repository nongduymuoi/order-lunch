import type { Metadata } from "next";
import { Suspense } from "react";
import {
  addDayItem,
  openToday,
  removeDayItem,
  setDayLocked,
  setDeadline,
  toggleSoldOut,
  updateDayItemStock,
} from "@/app/actions/admin";
import { Badge } from "@/components/badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageHeader, PageSkeleton } from "@/components/page";
import { SubmitButton } from "@/components/submit-button";
import { requireRole } from "@/lib/auth";
import { getDayMenu, getDayOrders, getMenuItems, getToday } from "@/lib/data";
import { CATEGORY_LABEL, formatVND } from "@/lib/format";
import { DEFAULT_DEADLINE, formatDate, isPast, todayISO, toHHMM } from "@/lib/time";

export const metadata: Metadata = { title: "Điều phối hôm nay — Đặt Cơm" };

export default function AdminTodayPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminTodayContent />
    </Suspense>
  );
}

async function AdminTodayContent() {
  const user = await requireRole("admin", "owner");
  const day = await getToday();

  if (!day) {
    return (
      <>
        <PageHeader eyebrow={formatDate(todayISO())} title="Điều phối hôm nay" />
        <section className="card mx-auto max-w-lg p-8 text-center">
          <p className="font-display text-2xl font-semibold text-navy-900">Mở menu hôm nay</p>
          <p className="mt-2 text-sm text-muted">
            Tất cả món đang bán trong Thực đơn sẽ được đưa vào menu. Bạn có thể chỉnh số lượng và
            đánh dấu hết sau.
          </p>
          <form action={openToday} className="mt-6 flex items-end justify-center gap-3">
            <div className="text-left">
              <label htmlFor="deadline" className="label">
                Giờ chốt chọn món
              </label>
              <input
                id="deadline"
                name="deadline"
                type="time"
                defaultValue={DEFAULT_DEADLINE}
                className="input w-36"
                required
              />
            </div>
            <SubmitButton pendingText="Đang mở…">Mở menu</SubmitButton>
          </form>
        </section>
      </>
    );
  }

  const [menu, dayOrders, catalog] = await Promise.all([
    getDayMenu(day.id, user.id),
    getDayOrders(day.id),
    getMenuItems(),
  ]);
  const inMenu = new Set(menu.map((m) => m.menuItemId));
  const addable = catalog.filter((c) => c.isActive && !inMenu.has(c.id));
  const revenue = dayOrders.reduce((s, o) => s + o.total, 0);
  const portions = menu.reduce((s, m) => s + m.orderedTotal, 0);
  const expired = isPast(day.deadline);

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        eyebrow={formatDate(day.date)}
        title="Điều phối hôm nay"
        actions={
          <form action={setDayLocked} className="flex items-center gap-3">
            <input type="hidden" name="dayId" value={day.id} />
            <input type="hidden" name="locked" value={day.isLocked ? "false" : "true"} />
            {day.isLocked ? (
              <>
                <Badge tone="navy">Đã chốt đơn</Badge>
                <SubmitButton className="btn-ghost" pendingText="Đang mở lại…">
                  Mở lại đơn
                </SubmitButton>
              </>
            ) : (
              <SubmitButton className="btn-dark" pendingText="Đang chốt…">
                Khóa &amp; chốt đơn
              </SubmitButton>
            )}
          </form>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="eyebrow">Giờ chốt</p>
          <form action={setDeadline} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="dayId" value={day.id} />
            <input
              name="deadline"
              type="time"
              defaultValue={toHHMM(day.deadline)}
              className="input w-28 py-1.5"
              required
            />
            <SubmitButton className="btn-ghost btn-sm">Lưu</SubmitButton>
          </form>
          <p className={`mt-2 text-xs ${expired ? "text-rose-600" : "text-muted"}`}>
            {expired ? "Đã quá giờ chốt" : "Còn đang nhận đơn"}
          </p>
        </div>
        <Metric label="Số đơn" value={String(dayOrders.length)} />
        <Metric label="Tổng phần" value={String(portions)} />
        <Metric label="Doanh thu" value={formatVND(revenue)} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy-900">Món trong menu hôm nay</h2>
            <p className="mt-1 text-xs text-muted">
              Để trống số lượng = không giới hạn. Đánh dấu hết bất cứ lúc nào khi có khách đặt ngoài.
            </p>
          </div>
          {addable.length > 0 && (
            <form action={addDayItem} className="flex items-center gap-2">
              <input type="hidden" name="dayId" value={day.id} />
              <select name="menuItemId" className="input w-56 py-2" required defaultValue="">
                <option value="" disabled>
                  Thêm món vào hôm nay…
                </option>
                {addable.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {formatVND(c.price)}
                  </option>
                ))}
              </select>
              <SubmitButton className="btn-ghost">Thêm</SubmitButton>
            </form>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-mist text-left text-xs text-muted">
              <tr>
                <th className="px-6 py-2.5 font-semibold">Món</th>
                <th className="px-3 py-2.5 text-right font-semibold">Giá</th>
                <th className="px-3 py-2.5 text-center font-semibold">Đã đặt</th>
                <th className="px-3 py-2.5 font-semibold">Số lượng bán</th>
                <th className="px-3 py-2.5 text-center font-semibold">Còn lại</th>
                <th className="px-6 py-2.5 text-right font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {menu.map((m) => {
                const remaining = m.stock === null ? null : m.stock - m.orderedTotal;
                return (
                  <tr key={m.dayItemId} className={m.isSoldOut ? "bg-rose-50/40" : ""}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-ink">{m.name}</p>
                      <p className="text-xs text-muted">{CATEGORY_LABEL[m.category]}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatVND(m.price)}</td>
                    <td className="px-3 py-3 text-center font-semibold tabular-nums">{m.orderedTotal}</td>
                    <td className="px-3 py-3">
                      <form action={updateDayItemStock} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={m.dayItemId} />
                        <input
                          name="stock"
                          type="number"
                          min={0}
                          defaultValue={m.stock ?? ""}
                          placeholder="∞"
                          className="input w-20 py-1.5 text-center"
                        />
                        <SubmitButton className="btn-ghost btn-sm">Lưu</SubmitButton>
                      </form>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {remaining === null ? (
                        <span className="text-muted">∞</span>
                      ) : (
                        <span className={remaining <= 0 ? "font-semibold text-rose-600" : "font-semibold"}>
                          {Math.max(0, remaining)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleSoldOut}>
                          <input type="hidden" name="id" value={m.dayItemId} />
                          <SubmitButton className={m.isSoldOut ? "btn-primary btn-sm" : "btn-danger btn-sm"}>
                            {m.isSoldOut ? "Mở bán lại" : "Đánh dấu hết"}
                          </SubmitButton>
                        </form>
                        {m.orderedTotal === 0 && (
                          <form action={removeDayItem}>
                            <input type="hidden" name="id" value={m.dayItemId} />
                            <SubmitButton className="btn-ghost btn-sm">Gỡ</SubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-8 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-navy-900">Danh sách lấy cơm</h2>
        {dayOrders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Chưa có đơn.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            {dayOrders.map((o) => (
              <li key={o.id} className="flex justify-between gap-4 border-b border-line pb-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{o.userName}</p>
                  <p className="text-muted">{o.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ")}</p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatVND(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-navy-900 tabular-nums">{value}</p>
    </div>
  );
}
