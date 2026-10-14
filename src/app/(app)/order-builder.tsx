"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { saveMyOrder } from "@/app/actions/order";
import { FormMessage } from "@/components/form-message";
import { SearchBox } from "@/components/search";
import type { Category } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { CATEGORY_LABEL, formatVND } from "@/lib/format";
import { priceLines } from "@/lib/pricing";
import { matchesQuery, MAX_NOTE_LENGTH } from "@/lib/text";

export type BuilderItem = {
  dayItemId: number;
  name: string;
  category: Category;
  price: number;
  salePrice: number | null;
  description: string | null;
  isSoldOut: boolean;
  savedQty: number;
  maxForMe: number | null;
};

const HARD_CAP = 20;

export function OrderBuilder({
  items,
  foodClosed,
  savedNote,
  noteAcknowledged,
}: {
  items: BuilderItem[];
  foodClosed: boolean;
  savedNote: string;
  noteAcknowledged: boolean;
}) {
  const [qty, setQty] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map((i) => [i.dayItemId, i.savedQty])),
  );
  const [note, setNote] = useState(savedNote);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  const quantityOf = (i: BuilderItem) =>
    foodClosed && i.category === "food" ? i.savedQty : (qty[i.dayItemId] ?? 0);
  const maxOf = (i: BuilderItem) => {
    const stockCap = i.maxForMe ?? HARD_CAP;
    // Món đã hết thì chỉ giữ được tối đa số phần đã đặt trước đó.
    return Math.min(HARD_CAP, i.isSoldOut ? Math.min(i.savedQty, stockCap) : stockCap);
  };

  const priced = priceLines(items.map((i) => ({ ...i, quantity: quantityOf(i) })));
  const selected = priced.lines.filter((l) => l.quantity > 0);
  const hasSaved = items.some((i) => i.savedQty > 0);
  const noteDirty = note.trim() !== savedNote;
  const dirty = items.some((i) => quantityOf(i) !== i.savedQty) || (hasSaved && noteDirty);

  function change(item: BuilderItem, delta: number) {
    if (foodClosed && item.category === "food") return;
    setState(null);
    setQty((prev) => {
      const next = Math.max(0, Math.min(maxOf(item), (prev[item.dayItemId] ?? 0) + delta));
      return { ...prev, [item.dayItemId]: next };
    });
  }

  function linesOf(mode: "current" | "drop-drinks") {
    return items
      .map((item) => ({
        dayItemId: item.dayItemId,
        quantity:
          mode === "drop-drinks"
            ? item.category === "food"
              ? item.savedQty
              : 0
            : quantityOf(item),
      }))
      .filter((line) => line.quantity > 0);
  }

  function submit(lines: { dayItemId: number; quantity: number }[]) {
    startTransition(async () => {
      const result = await saveMyOrder(lines, note);
      setState(result);
      if (result?.success && lines.every((l) => l.quantity === 0)) {
        setQty(Object.fromEntries(items.map((i) => [i.dayItemId, 0])));
      }
    });
  }

  const groups: Category[] = foodClosed ? ["drink"] : ["food", "drink"];
  const savedFood = items.some((item) => item.category === "food" && item.savedQty > 0);
  const savedDrinks = items.some((item) => item.category === "drink" && item.savedQty > 0);
  const visible = items.filter((i) => matchesQuery(i.name, query));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        <SearchBox value={query} onChange={setQuery} placeholder="Tìm món ăn, đồ uống theo tên…" />
        {query && visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">
            Không tìm thấy món nào khớp “{query}”.
          </p>
        )}
        {foodClosed && !items.some((item) => item.category === "drink") && (
          <p className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">
            Hôm nay không có đồ uống để đặt.
          </p>
        )}
        {groups.map((cat) => {
          const total = items.filter((i) => i.category === cat).length;
          const list = visible.filter((i) => i.category === cat);
          if (list.length === 0) return null;
          const scroll = cat === "drink";
          return (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-navy-900">{CATEGORY_LABEL[cat]}</h2>
                  {cat === "drink" && (
                    <p className="mt-1 text-xs text-royal-600">Giảm 20% khi đặt ship mang về</p>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {list.length === total ? `${total} món` : `${list.length}/${total} món`}
                </span>
              </div>
              <ItemGrid scroll={scroll} count={list.length}>
                {list.map((item) => {
                  const q = quantityOf(item);
                  const remaining = item.maxForMe === null ? null : item.maxForMe - q;
                  const unavailable = item.isSoldOut || (remaining !== null && remaining <= 0 && q === 0);
                  return (
                    <article
                      key={item.dayItemId}
                      className={`card flex flex-col p-5 transition ${
                        q > 0 ? "ring-2 ring-royal-500/70" : "hover:shadow-lift"
                      } ${unavailable ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ink">{item.name}</h3>
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right tabular-nums">
                          <PriceTag price={item.price} salePrice={item.salePrice} />
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <StockPill soldOut={item.isSoldOut} remaining={remaining} />
                        <Stepper
                          value={q}
                          disabled={pending || (foodClosed && item.category === "food")}
                          canDecrease={q > 0}
                          canIncrease={q < maxOf(item)}
                          onChange={(d) => change(item, d)}
                          label={item.name}
                        />
                      </div>
                    </article>
                  );
                })}
              </ItemGrid>
            </section>
          );
        })}
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-gradient-to-b from-royal-50 to-white px-6 py-5">
            <p className="eyebrow">Giỏ của bạn</p>
            <p className="mt-1 font-display text-3xl font-semibold text-navy-900 tabular-nums">
              {formatVND(priced.total)}
            </p>
            {priced.subtotal > priced.total && (
              <p className="mt-1 text-xs text-royal-600">
                <span className="mr-1.5 text-slate-400 line-through">{formatVND(priced.subtotal)}</span>
                Tiết kiệm {formatVND(priced.subtotal - priced.total)}
              </p>
            )}
          </div>
          <div className="px-6 py-4">
            {selected.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Chọn món bên trái để thêm vào giỏ.</p>
            ) : (
              <ul className="space-y-2.5">
                {selected.map((l) => (
                  <li key={l.dayItemId} className="flex justify-between gap-3 text-sm">
                    <span className="text-ink">
                      <span className="mr-1.5 text-muted tabular-nums">{l.quantity}×</span>
                      {l.name}
                      {foodClosed && l.category === "food" && (
                        <span className="ml-1.5 text-xs text-muted">· đã chốt</span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {l.discounted && (
                        <span className="mr-1.5 text-xs text-slate-400 line-through">
                          {formatVND(l.price * l.quantity)}
                        </span>
                      )}
                      <span className={l.discounted ? "font-semibold text-royal-700" : "text-navy-900"}>
                        {formatVND(l.finalPrice * l.quantity)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-line px-6 py-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="order-note" className="label !mb-0">
                Ghi chú cho quán
              </label>
              {savedNote && !noteDirty && (
                noteAcknowledged ? (
                  <span className="text-xs font-semibold text-emerald-600">✓ Quán đã xác nhận</span>
                ) : (
                  <span className="text-xs text-amber-700">Chờ quán xác nhận</span>
                )
              )}
            </div>
            <textarea
              id="order-note"
              value={note}
              onChange={(e) => {
                setState(null);
                setNote(e.target.value);
              }}
              maxLength={MAX_NOTE_LENGTH}
              rows={2}
              disabled={pending}
              placeholder="VD: ít cơm, không hành, đá riêng…"
              className="input resize-none"
            />
            {hasSaved && noteDirty && (
              <p className="mt-1 text-xs text-muted">Bấm “Cập nhật đơn” để gửi ghi chú.</p>
            )}
          </div>
          <div className="space-y-3 border-t border-line px-6 py-5">
            <button
              type="button"
              className="btn-primary w-full py-3"
              disabled={pending || !dirty || selected.length === 0}
              onClick={() => submit(linesOf("current"))}
            >
              {pending ? "Đang lưu…" : hasSaved ? "Cập nhật đơn" : "Xác nhận đặt món"}
            </button>
            {foodClosed && savedFood && savedDrinks && (
              <button
                type="button"
                className="btn-ghost w-full"
                disabled={pending}
                onClick={() => submit(linesOf("drop-drinks"))}
              >
                Bỏ đồ uống
              </button>
            )}
            {(!foodClosed || !savedFood) && hasSaved && (
              <button type="button" className="btn-ghost w-full" disabled={pending} onClick={() => submit([])}>
                Hủy đơn hôm nay
              </button>
            )}
            {dirty && hasSaved && !pending && (
              <p className="text-center text-xs text-amber-700">Bạn có thay đổi chưa lưu.</p>
            )}
            <FormMessage state={state} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function PriceTag({ price, salePrice }: { price: number; salePrice: number | null }) {
  const discounted = salePrice !== null && salePrice > 0 && salePrice < price;
  if (!discounted) {
    return <p className="font-semibold text-navy-900">{formatVND(price)}</p>;
  }
  return (
    <>
      <p className="text-xs text-slate-400 line-through">{formatVND(price)}</p>
      <p className="font-semibold text-royal-700">{formatVND(salePrice)}</p>
    </>
  );
}

function ItemGrid({ scroll, count, children }: { scroll: boolean; count: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const [rail, setRail] = useState({ show: false, thumb: 0, offset: 0 });

  useEffect(() => {
    if (!scroll) return;
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollHeight - el.clientHeight > 12;
      const track = Math.max(0, el.clientHeight - 24);
      const thumb = overflow ? Math.max(48, (el.clientHeight / el.scrollHeight) * track) : 0;
      const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
      const offset = overflow ? (el.scrollTop / maxScroll) * Math.max(0, track - thumb) : 0;
      setRail({ show: overflow, thumb, offset });
      setMoreBelow(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 12);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [scroll, count]);

  if (!scroll) return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

  return (
    <div className="relative">
      <div
        ref={ref}
        className="menu-scroll grid max-h-[34rem] gap-4 overscroll-contain rounded-2xl border border-line bg-royal-50/40 p-3 pr-7 sm:grid-cols-2 sm:p-4"
      >
        {children}
      </div>
      {rail.show && (
        <div aria-hidden className="pointer-events-none absolute top-3 right-2 bottom-3 w-2.5 rounded-full bg-royal-200">
          <div
            className="w-full rounded-full bg-royal-700"
            style={{ height: rail.thumb, transform: `translateY(${rail.offset}px)` }}
          />
        </div>
      )}
      {moreBelow && (
        <p className="mt-2 text-center text-xs font-semibold text-royal-700">↓ Kéo thanh bên phải để xem thêm đồ uống</p>
      )}
    </div>
  );
}

function StockPill({ soldOut, remaining }: { soldOut: boolean; remaining: number | null }) {
  if (soldOut || (remaining !== null && remaining <= 0)) {
    return (
      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">
        Đã hết
      </span>
    );
  }
  if (remaining === null) {
    return <span className="text-xs text-muted">Còn nhiều</span>;
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        remaining <= 3
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-royal-50 text-royal-700 ring-royal-100"
      }`}
    >
      Còn {remaining} phần
    </span>
  );
}

function Stepper({
  value,
  disabled,
  canDecrease,
  canIncrease,
  onChange,
  label,
}: {
  value: number;
  disabled: boolean;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
  label: string;
}) {
  const btn =
    "flex size-8 items-center justify-center rounded-lg text-lg leading-none transition disabled:cursor-not-allowed disabled:opacity-30";
  if (value === 0) {
    return (
      <button
        type="button"
        className="btn-dark btn-sm"
        disabled={disabled || !canIncrease}
        onClick={() => onChange(1)}
        aria-label={`Thêm ${label}`}
      >
        + Chọn
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-mist p-1">
      <button
        type="button"
        className={`${btn} text-navy-800 hover:bg-white`}
        disabled={disabled || !canDecrease}
        onClick={() => onChange(-1)}
        aria-label={`Bớt ${label}`}
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        className={`${btn} bg-navy-900 text-white hover:bg-navy-800`}
        disabled={disabled || !canIncrease}
        onClick={() => onChange(1)}
        aria-label={`Thêm ${label}`}
      >
        +
      </button>
    </div>
  );
}
