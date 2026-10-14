import type { OrderLine } from "@/lib/data";
import { formatVND } from "@/lib/format";

export function OrderLines({ lines, total }: { lines: OrderLine[]; total: number }) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const saved = subtotal - total;
  return (
    <div>
      <ul className="divide-y divide-line">
        {lines.map((l) => {
          const discounted = l.finalUnitPrice < l.unitPrice;
          return (
            <li key={l.id} className="flex items-start justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  <span className="mr-1.5 text-muted tabular-nums">{l.quantity}×</span>
                  {l.name}
                </p>
                {discounted && l.category === "drink" && (
                  <p className="mt-0.5 text-xs text-royal-600">Giá ship mang về</p>
                )}
              </div>
              <div className="shrink-0 text-right text-sm tabular-nums">
                {discounted && (
                  <span className="mr-2 text-xs text-slate-400 line-through">
                    {formatVND(l.unitPrice * l.quantity)}
                  </span>
                )}
                <span className={discounted ? "font-semibold text-royal-700" : "font-medium text-ink"}>
                  {formatVND(l.finalUnitPrice * l.quantity)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm text-muted">
          Tổng cộng
          {saved > 0 && <span className="ml-2 text-xs text-royal-600">(tiết kiệm {formatVND(saved)})</span>}
        </span>
        <span className="font-display text-lg font-semibold text-navy-900 tabular-nums">
          {formatVND(total)}
        </span>
      </div>
    </div>
  );
}
