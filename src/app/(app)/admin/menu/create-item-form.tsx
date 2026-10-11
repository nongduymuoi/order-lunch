"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMenuItem } from "@/app/actions/admin";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function CreateItemForm() {
  const [state, action] = useActionState(createMenuItem, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <span className="label">Loại</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "food", label: "Món ăn" },
            { value: "drink", label: "Đồ uống" },
          ].map((o, i) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center justify-center rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-navy-800 transition has-checked:border-royal-500 has-checked:bg-royal-50 has-checked:text-royal-700"
            >
              <input type="radio" name="category" value={o.value} defaultChecked={i === 0} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="new-name" className="label">
          Tên món
        </label>
        <input id="new-name" name="name" className="input" placeholder="VD: Cơm gà xối mỡ" maxLength={120} required />
      </div>
      <div>
        <label htmlFor="new-price" className="label">
          Giá (VNĐ)
        </label>
        <input
          id="new-price"
          name="price"
          type="number"
          min={1000}
          step={500}
          className="input tabular-nums"
          placeholder="45000"
          required
        />
      </div>
      <div>
        <label htmlFor="new-desc" className="label">
          Mô tả (tuỳ chọn)
        </label>
        <input id="new-desc" name="description" className="input" placeholder="Thành phần, khẩu phần…" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Đang thêm…">
        Thêm vào thực đơn
      </SubmitButton>
    </form>
  );
}
