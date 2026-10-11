"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { requestDeposit } from "@/app/actions/deposit";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { vietQrUrl, type BankAccount } from "@/lib/bank";
import { formatVND } from "@/lib/format";

const QR_DEBOUNCE_MS = 500;

export function DepositForm({ bank, content }: { bank: BankAccount | null; content: string }) {
  const [amountText, setAmountText] = useState("");
  const amount = Number(amountText) || 0;
  const [qrAmount, setQrAmount] = useState(0);
  const [state, action] = useActionState(
    async (prev: Awaited<ReturnType<typeof requestDeposit>>, formData: FormData) => {
      const result = await requestDeposit(prev, formData);
      if (result?.success) setAmountText("");
      return result;
    },
    null,
  );

  useEffect(() => {
    const t = setTimeout(() => setQrAmount(amount), QR_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [amount]);

  return (
    <div className="space-y-6">
      {bank ? (
        <div className="text-center">
          <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-card ring-1 ring-line">
            <Image
              key={qrAmount}
              src={vietQrUrl(bank, qrAmount, content)}
              alt={`Mã QR chuyển khoản ${qrAmount ? formatVND(qrAmount) : ""}`}
              width={260}
              height={300}
              unoptimized
              className="h-auto w-[260px]"
            />
          </div>
          <p className="mt-3 text-xs text-muted">Quét bằng app ngân hàng bất kỳ</p>
          <dl className="mx-auto mt-4 max-w-sm space-y-2 text-left text-sm">
            <InfoRow label="Ngân hàng" value={bank.bankName} />
            <InfoRow label="Chủ tài khoản" value={bank.accountName} />
            <InfoRow label="Số tài khoản" value={bank.accountNo} copy highlight />
            <InfoRow label="Nội dung" value={content} copy />
            <InfoRow label="Số tiền" value={amount ? formatVND(amount) : "—"} />
          </dl>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Chưa điền tài khoản nhận tiền trong file <span className="font-semibold">.env.local</span> nên chưa
          hiện được mã QR. Bạn vẫn có thể gửi yêu cầu sau khi chuyển khoản.
        </p>
      )}

      <p className="rounded-xl bg-royal-50 px-4 py-3 text-sm text-navy-800 ring-1 ring-royal-100">
        Chuyển khoản xong → nhập số tiền → bấm <span className="font-semibold">Gửi yêu cầu nạp</span>. Admin
        sẽ xác nhận và cộng vào số dư.
      </p>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="amount" className="label">
            Số tiền (VNĐ)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1000}
            step={1000}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ""))}
            className="input text-base font-semibold tabular-nums"
            placeholder="150000"
            required
          />
          {amount > 0 && (
            <p className="mt-1.5 text-sm font-semibold text-royal-700 tabular-nums">{formatVND(amount)}</p>
          )}
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full" pendingText="Đang gửi…" disabled={amount < 1000}>
          Gửi yêu cầu nạp
        </SubmitButton>
      </form>
    </div>
  );
}

function InfoRow({
  label,
  value,
  copy,
  highlight,
}: {
  label: string;
  value: string;
  copy?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3.5 py-2">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate font-semibold tabular-nums ${
            highlight ? "text-base tracking-wide text-royal-700" : "text-navy-900"
          }`}
        >
          {value}
        </span>
        {copy && (
          <button
            type="button"
            className="shrink-0 rounded-md border border-line bg-white px-2 py-0.5 text-[0.7rem] font-semibold text-navy-800 hover:bg-royal-50"
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Đã chép" : "Chép"}
          </button>
        )}
      </dd>
    </div>
  );
}
