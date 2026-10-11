import type { PaymentStatus } from "@/lib/data";
import { formatVND } from "@/lib/format";

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function PaymentBadge({
  status,
  owed,
}: {
  status: PaymentStatus;
  owed?: number;
}) {
  if (status === "paid") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}>
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Đã thanh toán
      </span>
    );
  }
  return (
    <span className={`${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`}>
      <span className="size-1.5 rounded-full bg-rose-500" />
      {status === "partial" ? "Còn thiếu" : "Chưa thanh toán"}
      {owed ? ` · ${formatVND(owed)}` : ""}
    </span>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "navy" | "gray" | "red" | "amber" | "green";
}) {
  const tones = {
    blue: "bg-royal-50 text-royal-700 ring-royal-200",
    navy: "bg-navy-900 text-white ring-navy-900",
    gray: "bg-mist text-muted ring-line",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return <span className={`${base} ring-1 ${tones[tone]}`}>{children}</span>;
}

export function BalanceValue({ amount, className = "" }: { amount: number; className?: string }) {
  return (
    <span className={`tabular-nums ${amount < 0 ? "text-rose-600" : "text-navy-900"} ${className}`}>
      {amount < 0 ? "−" : ""}
      {formatVND(Math.abs(amount))}
    </span>
  );
}
