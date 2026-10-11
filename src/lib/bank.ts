export type BankAccount = {
  /** Mã ngân hàng theo VietQR: tên viết tắt (MB, VCB, TCB…) hoặc mã BIN 6 số. */
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
};

export function getBankAccount(): BankAccount | null {
  const bankId = process.env.BANK_ID?.trim();
  const accountNo = process.env.BANK_ACCOUNT_NO?.trim();
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim();
  if (!bankId || !accountNo || !accountName) return null;
  return {
    bankId,
    accountNo,
    accountName: accountName.toUpperCase(),
    bankName: process.env.BANK_NAME?.trim() || bankId,
  };
}

export function vietQrUrl(bank: BankAccount, amount: number, content: string): string {
  const params = new URLSearchParams({ accountName: bank.accountName, addInfo: content });
  if (amount > 0) params.set("amount", String(amount));
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bankId)}-${encodeURIComponent(
    bank.accountNo,
  )}-compact2.png?${params}`;
}
