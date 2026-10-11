import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteMenuItem, toggleMenuItem, updateMenuItem } from "@/app/actions/admin";
import { Badge } from "@/components/badges";
import { PageHeader, PageSkeleton } from "@/components/page";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getMenuItems } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/format";
import { CreateItemForm } from "./create-item-form";

export const metadata: Metadata = { title: "Thực đơn — Đặt Cơm" };

export default function AdminMenuPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminMenuContent />
    </Suspense>
  );
}

async function AdminMenuContent() {
  await requireRole("admin", "owner");
  const items = await getMenuItems();
  const groups: Category[] = ["food", "drink"];

  return (
    <>
      <PageHeader
        eyebrow="Quản lý"
        title="Thực đơn của quán"
        description="Món ẩn sẽ không được đưa vào menu khi mở đơn ngày mới. Đổi giá chỉ áp dụng cho các lượt đặt sau đó."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card h-fit p-6 lg:sticky lg:top-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-navy-900">Thêm món mới</h2>
          <CreateItemForm />
        </section>

        <div className="space-y-8 lg:col-span-2">
          {groups.map((cat) => {
            const list = items.filter((i) => i.category === cat);
            return (
              <section key={cat} className="card overflow-hidden">
                <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
                  <h2 className="font-display text-xl font-semibold text-navy-900">{CATEGORY_LABEL[cat]}</h2>
                  <span className="text-xs text-muted">{list.length} món</span>
                </div>
                {list.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted">Chưa có món nào.</p>
                ) : (
                  <ul className="divide-y divide-line border-t border-line">
                    {list.map((item) => (
                      <li key={item.id} className={`px-6 py-4 ${item.isActive ? "" : "bg-mist/70"}`}>
                        <form action={updateMenuItem} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-start">
                          <input type="hidden" name="id" value={item.id} />
                          <div className="space-y-2">
                            <input
                              name="name"
                              defaultValue={item.name}
                              className="input py-2 font-medium"
                              aria-label="Tên món"
                              required
                            />
                            <input
                              name="description"
                              defaultValue={item.description ?? ""}
                              className="input py-1.5 text-xs"
                              placeholder="Mô tả ngắn (tuỳ chọn)"
                              aria-label="Mô tả"
                            />
                          </div>
                          <div className="relative">
                            <input
                              name="price"
                              type="number"
                              min={1000}
                              step={500}
                              defaultValue={item.price}
                              className="input py-2 pr-7 text-right tabular-nums"
                              aria-label="Giá"
                              required
                            />
                            <span className="pointer-events-none absolute top-2.5 right-3 text-xs text-muted">đ</span>
                          </div>
                          <SubmitButton className="btn-ghost">Lưu</SubmitButton>
                        </form>
                        <div className="mt-3 flex items-center gap-2">
                          {item.isActive ? <Badge tone="green">Đang bán</Badge> : <Badge tone="gray">Đang ẩn</Badge>}
                          <form action={toggleMenuItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <SubmitButton className="btn-ghost btn-sm">
                              {item.isActive ? "Ẩn món" : "Bán lại"}
                            </SubmitButton>
                          </form>
                          <form action={deleteMenuItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <SubmitButton className="btn-danger btn-sm">Xóa</SubmitButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
