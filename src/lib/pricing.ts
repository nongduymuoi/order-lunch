import type { Category } from "@/db/schema";

export const DRINK_COMBO_DISCOUNT = 0.2;

export type PricedInput = {
  category: Category;
  price: number;
  quantity: number;
};

export type PricedLine<T extends PricedInput> = T & {
  finalPrice: number;
  discounted: boolean;
};

/** Nước giảm 20% khi trong cùng đơn có ít nhất một món ăn. */
export function applyComboPricing<T extends PricedInput>(lines: T[]): {
  lines: PricedLine<T>[];
  hasCombo: boolean;
  subtotal: number;
  total: number;
} {
  const active = lines.filter((l) => l.quantity > 0);
  const hasFood = active.some((l) => l.category === "food");
  const hasDrink = active.some((l) => l.category === "drink");
  const hasCombo = hasFood && hasDrink;

  const priced = lines.map((l) => {
    const discounted = hasCombo && l.category === "drink";
    const finalPrice = discounted
      ? Math.round((l.price * (1 - DRINK_COMBO_DISCOUNT)) / 100) * 100
      : l.price;
    return { ...l, finalPrice, discounted };
  });

  const subtotal = active.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = priced.reduce((s, l) => s + l.finalPrice * l.quantity, 0);
  return { lines: priced, hasCombo, subtotal, total };
}
