export const MAX_NOTE_LENGTH = 300;

/** Bỏ dấu tiếng Việt và viết thường, để "ca phe" tìm được "Cà phê". */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function matchesQuery(text: string, query: string): boolean {
  const q = foldText(query);
  return q === "" || foldText(text).includes(q);
}

/** Nội dung chuyển khoản: không dấu, chỉ chữ và số, vì nhiều ngân hàng tự cắt ký tự lạ. */
export function transferContent(displayName: string): string {
  const name = foldText(displayName)
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 40);
  return `${name} nap tien`.trim();
}
