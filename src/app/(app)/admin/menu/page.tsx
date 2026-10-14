import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteMenuItem, toggleMenuItem } from "@/app/actions/admin";
import { Badge } from "@/components/badges";
import { PageHeader, PageSkeleton } from "@/components/page";
import { SearchItem, SearchScope } from "@/components/search";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getMenuItems } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/format";
import { CreateItemForm } from "./create-item-form";
import { MenuItemEditor } from "./menu-item-editor";

export const metadata: Metadata = { title: "Thực đơn — Mộc" };

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
        description="Món ẩn sẽ không được đưa vào menu khi mở đơn ngày mới. Giá gốc và giá sau giảm chỉ áp dụng cho các lượt đặt sau đó."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card h-fit p-6 lg:sticky lg:top-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-navy-900">Thêm món mới</h2>
          <CreateItemForm />
        </section>

        <div className="space-y-8 lg:col-span-2">
          <SearchScope placeholder="Tìm món ăn, đồ uống trong thực đơn…">
          {groups.map((cat) => {
            const list = items.filter((i) => i.category === cat);
            return (
              <SearchItem
                as="section"
                key={cat}
                text={list.map((i) => i.name).join("\n")}
                className="card overflow-hidden"
              >
                <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
                  <h2 className="font-display text-xl font-semibold text-navy-900">{CATEGORY_LABEL[cat]}</h2>
                  <span className="text-xs text-muted">{list.length} món</span>
                </div>
                {list.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted">Chưa có món nào.</p>
                ) : (
                  <ul className="divide-y divide-line border-t border-line">
                    {list.map((item) => (
                      <SearchItem
                        as="li"
                        text={item.name}
                        key={item.id}
                        className={`px-6 py-4 ${item.isActive ? "" : "bg-mist/70"}`}
                      >
                        <MenuItemEditor item={item} />
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
                      </SearchItem>
                    ))}
                  </ul>
                )}
              </SearchItem>
            );
          })}
          </SearchScope>
        </div>
      </div>
    </>
  );
}
