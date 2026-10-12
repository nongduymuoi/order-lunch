"use client";

import { useActionState } from "react";
import { adjustBalance } from "@/app/actions/deposit";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function AdjustForm({
  members,
}: {
  members: { id: number; name: string; username: string }[];
}) {
  const [state, action] = useActionState(adjustBalance, null);

  return (
    <form action={action} className="card p-6">
      <h2 className="font-display text-xl font-semibold text-navy-900">Cộng hoặc trừ tiền</h2>
      <p className="mt-1 text-sm text-muted">
        Cộng tiền làm các đơn cũ được trả trước. Trừ tiền giảm số dư, thiếu thì thành nợ.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="userId" className="label">
            Thành viên
          </label>
          <select id="userId" name="userId" className="input" required defaultValue="">
            <option value="" disabled>
              Chọn thành viên…
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (@{m.username})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="label">
            Số tiền
          </label>
          <input
            id="amount"
            name="amount"
            inputMode="numeric"
            className="input"
            placeholder="VD: 50000"
            required
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="note" className="label">
          Ghi chú
        </label>
        <input id="note" name="note" className="input" maxLength={200} placeholder="Không bắt buộc" />
      </div>
      <FormMessage state={state} />
      <div className="mt-5 flex flex-wrap gap-2">
        <SubmitButton name="direction" value="credit" className="btn-primary" pendingText="Đang cộng…">
          Cộng tiền
        </SubmitButton>
        <SubmitButton name="direction" value="debit" className="btn-danger" pendingText="Đang trừ…">
          Trừ tiền
        </SubmitButton>
      </div>
    </form>
  );
}
