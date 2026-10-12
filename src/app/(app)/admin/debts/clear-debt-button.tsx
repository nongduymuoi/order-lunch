"use client";

import { clearUserDebt } from "@/app/actions/deposit";
import { SubmitButton } from "@/components/submit-button";

export function ClearDebtButton({ userId, owedLabel }: { userId: number; owedLabel: string }) {
  return (
    <form
      action={clearUserDebt}
      onSubmit={(event) => {
        if (!window.confirm(`Xác nhận ${owedLabel} đã trả hết nợ? Nợ của người này sẽ về 0.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className="btn-primary" pendingText="Đang xóa nợ…">
        Đánh dấu đã trả, xóa nợ
      </SubmitButton>
    </form>
  );
}
