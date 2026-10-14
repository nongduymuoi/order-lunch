"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavIcon =
  | "today"
  | "history"
  | "report"
  | "wallet"
  | "menu"
  | "control"
  | "orders"
  | "drinks"
  | "approve"
  | "debt"
  | "profile";

export type NavItem = { href: string; label: string; icon: NavIcon };

const paths: Record<NavIcon, string> = {
  today: "M4 13h16M6 13a6 6 0 0 1 12 0M3 17h18M12 5v2",
  history: "M12 8v4l2.5 2.5M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3 4v4h4",
  report: "M5 20V10M12 20V4M19 20v-7",
  wallet: "M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7Zm0 0 11-3v3M16 13h1",
  menu: "M7 4v16M17 4c-1.7 0-3 2-3 5s1.3 4 3 4v7M4 4v4a3 3 0 0 0 6 0V4",
  control: "M5 6h9M18 6h1M5 12h3M12 12h7M5 18h11M20 18h-1M14 4v4M8 10v4M16 16v4",
  orders: "M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01",
  drinks: "M8 8h8l-1 11H9L8 8Zm0 0 1-3h6l1 3M10 12v4M14 12v4",
  approve: "M9 12.5 11 14.5 15.5 10M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z",
  debt: "M12 3v18M8 8h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7",
  profile: "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0",
};

function Icon({ name }: { name: NavIcon }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavLinks({ groups }: { groups: { title: string; items: NavItem[] }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-6 lg:overflow-visible">
      {groups.map((g) => (
        <div key={g.title} className="flex gap-1 lg:flex-col">
          <p className="mb-2 hidden px-3 text-[0.65rem] font-semibold tracking-[0.2em] text-royal-200/50 uppercase lg:block">
            {g.title}
          </p>
          {g.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition ${
                  active
                    ? "bg-white/10 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
                    : "text-royal-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute top-2 bottom-2 left-0 hidden w-0.5 rounded-full bg-royal-400 lg:block" />
                )}
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
