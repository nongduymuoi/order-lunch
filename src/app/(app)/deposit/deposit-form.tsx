"use client";

import { useActionState, useRef, useEffect } from "react";
import { requestDeposit } from "@/app/actions/deposit";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { formatVND } from "@/lib/format";

const PRESETS = [100_000, 200_000, 500_000];

export function DepositForm({ suggested }: { suggested?: number }) {
  const [state, action] = useActionState(requestDeposit, null);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const presets = suggested ? [suggested, ...PRESETS.filter((p) => p !== suggested)] : PRESETS;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label htmlFor="amount" className="label">
          Số tiền (VNĐ)
        </label>
        <input
          ref={amountRef}
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1000}
          step={1000}
          className="input text-base font-semibold tabular-nums"
          placeholder="200000"
          required
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button
              key={p}
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                if (amountRef.current) amountRef.current.value = String(p);
              }}
            >
              {suggested && i === 0 ? `Trả nợ ${formatVND(p)}` : formatVND(p)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="note" className="label">
          Ghi chú (tuỳ chọn)
        </label>
        <input id="note" name="note" className="input" maxLength={200} placeholder="VD: Chuyển khoản MB 9h15" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Đang gửi…">
        Gửi yêu cầu nạp
      </SubmitButton>
    </form>
  );
}
