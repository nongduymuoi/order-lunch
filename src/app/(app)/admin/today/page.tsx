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
import { SearchItem, SearchScope } from "@/components/search";
import { MenuImageEditor } from "./menu-image-editor";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getDayMenu, getDayOrders, getMenuItems, getToday, type DayMenuItem } from "@/lib/data";
import { CATEGORY_LABEL, formatVND } from "@/lib/format";
import { DEFAULT_DEADLINE, formatDate, isPast, todayISO, toHHMM } from "@/lib/time";

export const metadata: Metadata = { title: "Quản lý menu hôm nay — Mộc" };

const TITLE = "Quản lý menu hôm nay";
const CATEGORIES: Category[] = ["food", "drink"];

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
        <PageHeader eyebrow={formatDate(todayISO())} title={TITLE} />
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
        title={TITLE}
        actions={
          <form action={setDayLocked} className="flex items-center gap-3">
            <input type="hidden" name="dayId" value={day.id} />
            <input type="hidden" name="locked" value={day.isLocked ? "false" : "true"} />
            {day.isLocked ? (
              <>
                <Badge tone="navy">Cơm đã chốt</Badge>
                <SubmitButton className="btn-ghost" pendingText="Đang mở lại…">
                  Mở lại cơm
                </SubmitButton>
              </>
            ) : (
              <SubmitButton className="btn-dark" pendingText="Đang chốt…">
                Chốt cơm trưa
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
            {expired ? "Đã hết giờ cơm, vẫn nhận nước" : "Cơm và nước đều đang mở"}
          </p>
        </div>
        <Metric label="Số đơn" value={String(dayOrders.length)} />
        <Metric label="Tổng phần" value={String(portions)} />
        <Metric label="Doanh thu" value={formatVND(revenue)} />
      </div>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy-900">Món trong menu hôm nay</h2>
            <p className="mt-1 text-xs text-muted">
              Để trống số lượng = không giới hạn. Đánh dấu hết bất cứ lúc nào khi có khách đặt ngoài.
            </p>
          </div>
          {addable.length > 0 && (
            <form action={addDayItem} className="flex items-center gap-2">
              <input type="hidden" name="dayId" value={day.id} />
              <select name="menuItemId" className="input w-60 py-2" required defaultValue="">
                <option value="" disabled>
                  Thêm món vào hôm nay…
                </option>
                {CATEGORIES.map((cat) => {
                  const options = addable.filter((c) => c.category === cat);
                  if (options.length === 0) return null;
                  return (
                    <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                      {options.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ·{" "}
                          {c.salePrice !== null && c.salePrice < c.price
                            ? `${formatVND(c.salePrice)} (gốc ${formatVND(c.price)})`
                            : formatVND(c.price)}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <SubmitButton className="btn-ghost">Thêm</SubmitButton>
            </form>
          )}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <MenuImageEditor dayId={day.id} slot="food" title="Ảnh menu cơm" url={day.menuImageUrl} />
          <MenuImageEditor dayId={day.id} slot="drink" title="Ảnh menu nước" url={day.drinkMenuImageUrl} />
        </div>

        <SearchScope placeholder="Tìm món ăn, đồ uống trong menu hôm nay…" className="mb-6">
          <div className="space-y-8">
            {CATEGORIES.map((cat) => (
              <DayItemsTable
                key={cat}
                title={CATEGORY_LABEL[cat]}
                items={menu.filter((m) => m.category === cat)}
              />
            ))}
          </div>
        </SearchScope>
      </section>
    </>
  );
}

function DayItemsTable({ title, items }: { title: string; items: DayMenuItem[] }) {
  return (
    <SearchItem text={items.map((m) => m.name).join("\n")}>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-navy-900">{title}</h3>
        <span className="text-xs text-muted">{items.length} món</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-4 text-center text-sm text-muted">
          Chưa có món nào.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-mist text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Món</th>
                <th className="px-3 py-2.5 text-right font-semibold">Giá</th>
                <th className="px-3 py-2.5 text-center font-semibold">Đã đặt</th>
                <th className="px-3 py-2.5 font-semibold">Số lượng bán</th>
                <th className="px-3 py-2.5 text-center font-semibold">Còn lại</th>
                <th className="px-4 py-2.5 text-right font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((m) => {
                const remaining = m.stock === null ? null : m.stock - m.orderedTotal;
                return (
                  <SearchItem
                    key={m.dayItemId}
                    as="tr"
                    text={m.name}
                    className={m.isSoldOut ? "bg-rose-50/40" : ""}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {m.salePrice !== null && m.salePrice < m.price ? (
                        <div>
                          <div className="text-xs text-slate-400 line-through">{formatVND(m.price)}</div>
                          <div className="font-semibold text-royal-700">{formatVND(m.salePrice)}</div>
                        </div>
                      ) : (
                        formatVND(m.price)
                      )}
                    </td>
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
                    <td className="px-4 py-3">
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
                  </SearchItem>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SearchItem>
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
