"use client";

import { useState, useTransition } from "react";
import { saveMyOrder } from "@/app/actions/order";
import { FormMessage } from "@/components/form-message";
import type { Category } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { CATEGORY_LABEL, formatVND } from "@/lib/format";
import { applyComboPricing } from "@/lib/pricing";

export type BuilderItem = {
  dayItemId: number;
  name: string;
  category: Category;
  price: number;
  description: string | null;
  isSoldOut: boolean;
  savedQty: number;
  maxForMe: number | null;
};

const HARD_CAP = 20;

export function OrderBuilder({
  items,
  closedReason,
}: {
  items: BuilderItem[];
  closedReason: string | null;
}) {
  const [qty, setQty] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map((i) => [i.dayItemId, i.savedQty])),
  );
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();
  const closed = closedReason !== null;

  const quantityOf = (i: BuilderItem) => qty[i.dayItemId] ?? 0;
  const maxOf = (i: BuilderItem) => {
    const stockCap = i.maxForMe ?? HARD_CAP;
    // Món đã hết thì chỉ giữ được tối đa số phần đã đặt trước đó.
    return Math.min(HARD_CAP, i.isSoldOut ? Math.min(i.savedQty, stockCap) : stockCap);
  };

  const priced = applyComboPricing(
    items.map((i) => ({ ...i, quantity: quantityOf(i) })),
  );
  const pricedById = new Map(priced.lines.map((l) => [l.dayItemId, l]));
  const selected = priced.lines.filter((l) => l.quantity > 0);
  const hasSaved = items.some((i) => i.savedQty > 0);
  const dirty = items.some((i) => quantityOf(i) !== i.savedQty);

  function change(item: BuilderItem, delta: number) {
    setState(null);
    setQty((prev) => {
      const next = Math.max(0, Math.min(maxOf(item), (prev[item.dayItemId] ?? 0) + delta));
      return { ...prev, [item.dayItemId]: next };
    });
  }

  function submit(lines: { dayItemId: number; quantity: number }[]) {
    startTransition(async () => {
      const result = await saveMyOrder(lines);
      setState(result);
      if (result?.success && lines.every((l) => l.quantity === 0)) {
        setQty(Object.fromEntries(items.map((i) => [i.dayItemId, 0])));
      }
    });
  }

  const groups: Category[] = ["food", "drink"];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        {groups.map((cat) => {
          const list = items.filter((i) => i.category === cat);
          if (list.length === 0) return null;
          return (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-navy-900">{CATEGORY_LABEL[cat]}</h2>
                  {cat === "drink" && (
                    <p className="mt-1 text-xs text-royal-600">Giảm 20% khi đặt kèm ít nhất một món ăn</p>
                  )}
                </div>
                <span className="text-xs text-muted">{list.length} món</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((item) => {
                  const q = quantityOf(item);
                  const line = pricedById.get(item.dayItemId)!;
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
                          {line.discounted ? (
                            <>
                              <p className="text-xs text-slate-400 line-through">{formatVND(item.price)}</p>
                              <p className="font-semibold text-royal-700">{formatVND(line.finalPrice)}</p>
                            </>
                          ) : (
                            <p className="font-semibold text-navy-900">{formatVND(item.price)}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <StockPill soldOut={item.isSoldOut} remaining={remaining} />
                        <Stepper
                          value={q}
                          disabled={closed || pending}
                          canDecrease={q > 0}
                          canIncrease={q < maxOf(item)}
                          onChange={(d) => change(item, d)}
                          label={item.name}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
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
            {priced.hasCombo && priced.subtotal > priced.total && (
              <p className="mt-1 text-xs text-royal-600">
                <span className="mr-1.5 text-slate-400 line-through">{formatVND(priced.subtotal)}</span>
                Combo cơm + nước, tiết kiệm {formatVND(priced.subtotal - priced.total)}
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
          <div className="space-y-3 border-t border-line px-6 py-5">
            {closed ? (
              <p className="rounded-xl bg-mist px-4 py-3 text-center text-sm font-medium text-navy-800">
                {closedReason}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-primary w-full py-3"
                  disabled={pending || !dirty || selected.length === 0}
                  onClick={() => submit(selected.map((l) => ({ dayItemId: l.dayItemId, quantity: l.quantity })))}
                >
                  {pending ? "Đang lưu…" : hasSaved ? "Cập nhật đơn" : "Xác nhận đặt món"}
                </button>
                {hasSaved && (
                  <button
                    type="button"
                    className="btn-ghost w-full"
                    disabled={pending}
                    onClick={() => submit([])}
                  >
                    Hủy đơn hôm nay
                  </button>
                )}
                {dirty && hasSaved && !pending && (
                  <p className="text-center text-xs text-amber-700">Bạn có thay đổi chưa lưu.</p>
                )}
              </>
            )}
            <FormMessage state={state} />
          </div>
        </div>
      </aside>
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
