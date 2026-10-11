const vnd = new Intl.NumberFormat("vi-VN");

export function formatVND(amount: number): string {
  return `${vnd.format(amount)}đ`;
}

export const ROLE_LABEL = {
  user: "Thành viên",
  admin: "Quản lý",
  owner: "Chủ quán",
} as const;

export const CATEGORY_LABEL = {
  food: "Món ăn",
  drink: "Đồ uống",
} as const;
