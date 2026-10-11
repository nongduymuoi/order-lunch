export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`${className} relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-royal-500 to-navy-800 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] ring-1 ring-white/20`}
    >
      <span className="font-display text-[1.05em] font-semibold leading-none">M</span>
    </span>
  );
}

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="leading-tight">
        <p
          className={`font-display text-lg font-semibold ${tone === "light" ? "text-white" : "text-navy-900"}`}
        >
          Mộc
        </p>
        <p
          className={`text-[0.65rem] font-medium tracking-[0.22em] uppercase ${tone === "light" ? "text-royal-200/70" : "text-muted"}`}
        >
          Lunch with TaMy
        </p>
      </div>
    </div>
  );
}
