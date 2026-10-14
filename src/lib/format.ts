const vnd = new Intl.NumberFormat("vi-VN");

export function formatVND(amount: number): string {
  return `${vnd.format(amount)}đ`;
}

export const ROLE_LABEL = {
  user: "Thành viên",
  admin: "Chủ Quán",
  owner: "App Owner",
} as const;

export const CATEGORY_LABEL = {
  food: "Món ăn",
  drink: "Đồ uống",
} as const;

export const FOOD_CLOSED_MESSAGE = "Đã hết giờ cơm trưa, đặt nước thôi cả nhà ơiiiiii";
