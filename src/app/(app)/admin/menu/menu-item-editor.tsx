"use client";

import { useActionState } from "react";
import { updateMenuItem } from "@/app/actions/admin";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function MenuItemEditor({
  item,
}: {
  item: { id: number; name: string; description: string | null; price: number; salePrice: number | null };
}) {
  const [state, action] = useActionState(updateMenuItem, null);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_auto] sm:items-end">
      <input type="hidden" name="id" value={item.id} />
      <div className="space-y-2">
        <input name="name" defaultValue={item.name} className="input py-2 font-medium" aria-label="Tên món" required />
        <input
          name="description"
          defaultValue={item.description ?? ""}
          className="input py-1.5 text-xs"
          placeholder="Mô tả ngắn (tuỳ chọn)"
          aria-label="Mô tả"
        />
      </div>
      <div>
        <label className="label" htmlFor={`price-${item.id}`}>
          Giá gốc
        </label>
        <input
          id={`price-${item.id}`}
          name="price"
          type="number"
          min={1000}
          step={500}
          defaultValue={item.price}
          className="input py-2 text-right tabular-nums"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`sale-${item.id}`}>
          Giá sau giảm
        </label>
        <input
          id={`sale-${item.id}`}
          name="salePrice"
          type="number"
          min={500}
          step={500}
          defaultValue={item.salePrice ?? ""}
          placeholder="Không có"
          className="input py-2 text-right tabular-nums"
        />
      </div>
      <SubmitButton className="btn-ghost">Lưu</SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
