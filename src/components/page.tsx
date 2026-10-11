export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-3 w-24 rounded bg-line" />
      <div className="mb-8 h-9 w-64 rounded-lg bg-line" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-2xl bg-white shadow-card lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-white shadow-card" />
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-royal-50 text-royal-600 ring-1 ring-royal-100">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 13h16M6 13a6 6 0 0 1 12 0M3 17h18M12 5v2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-xl font-semibold text-navy-900">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}
