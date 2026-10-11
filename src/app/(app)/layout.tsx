import { Suspense } from "react";
import { logout } from "@/app/actions/auth";
import { BalanceValue } from "@/components/badges";
import { Brand } from "@/components/brand";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { isStaff, requireUser } from "@/lib/auth";
import { getBalance } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/format";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="relative z-20 bg-navy-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgb(58_108_240/0.28),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 px-4 py-4 lg:h-full lg:gap-8 lg:px-5 lg:py-7">
          <div className="px-1 lg:px-2">
            <Brand />
          </div>
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarContent />
          </Suspense>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
    </div>
  );
}

async function SidebarContent() {
  const user = await requireUser();
  const balance = await getBalance(user.id);

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Đặt cơm",
      items: [
        { href: "/", label: "Hôm nay", icon: "today" },
        { href: "/history", label: "Lịch sử", icon: "history" },
        { href: "/report", label: "Báo cáo", icon: "report" },
        { href: "/deposit", label: "Nạp tiền", icon: "wallet" },
      ],
    },
  ];
  if (isStaff(user.role)) {
    const items: NavItem[] = [
      { href: "/admin/today", label: "Quản lý menu hôm nay", icon: "control" },
      { href: "/admin/menu", label: "Thực đơn", icon: "menu" },
    ];
    if (user.role === "owner") {
      items.push({ href: "/admin/deposits", label: "Duyệt nạp tiền", icon: "approve" });
    }
    groups.push({ title: "Quản lý", items });
  }

  return (
    <>
      <div className="lg:flex-1">
        <NavLinks groups={groups} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 lg:block lg:p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-royal-200/60">
            @{user.username} · {ROLE_LABEL[user.role]}
          </p>
        </div>
        <div className="flex items-center gap-3 lg:mt-4 lg:justify-between lg:border-t lg:border-white/10 lg:pt-3">
          <div className="text-right lg:text-left">
            <p className="text-[0.65rem] tracking-[0.18em] text-royal-200/50 uppercase">Số dư</p>
            <BalanceValue
              amount={balance}
              className={`text-sm font-semibold ${balance < 0 ? "!text-rose-300" : "!text-white"}`}
            />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-royal-100/80 transition hover:bg-white/10 hover:text-white"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex animate-pulse gap-2 lg:flex-1 lg:flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 w-24 rounded-xl bg-white/5 lg:w-full" />
      ))}
    </div>
  );
}
