import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgb(232_184_92/0.28),transparent_55%),radial-gradient(ellipse_at_90%_90%,rgb(45_125_93/0.35),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgb(255_255_255)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Brand />
          <div className="max-w-md">
            <p className="eyebrow mb-5 !text-royal-200/70">Cơm trưa mỗi ngày</p>
            <h2 className="font-display text-5xl leading-[1.1] font-semibold text-white">
              Bữa trưa chỉn chu,
              <br />
              <span className="italic text-wood-300">đặt trong một chạm.</span>
            </h2>
            <div className="hairline my-8 !bg-[linear-gradient(90deg,rgb(228_201_164/0.7),transparent)]" />
            <ul className="space-y-3 text-sm text-royal-100/80">
              <li>— Xem menu và số phần còn lại theo thời gian thực</li>
              <li>— Nước uống giảm 20% khi đặt ship mang về</li>
              <li>— Theo dõi số dư và các đơn đã thanh toán</li>
            </ul>
          </div>
          <p className="text-xs text-royal-200/50">© powered by duymuoi</p>
        </div>
      </aside>
      <main className="flex items-center justify-center bg-mist px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand tone="dark" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
