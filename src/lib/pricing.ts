export type PricedInput = {
  price: number;
  salePrice: number | null;
  quantity: number;
};

export type PricedLine<T extends PricedInput> = T & {
  finalPrice: number;
  discounted: boolean;
};

/** Giá khách trả: giá sau giảm nếu quán đã nhập và nhỏ hơn giá gốc. */
export function chargePrice(price: number, salePrice: number | null): number {
  return salePrice !== null && salePrice > 0 && salePrice < price ? salePrice : price;
}

export function priceLines<T extends PricedInput>(lines: T[]): {
  lines: PricedLine<T>[];
  subtotal: number;
  total: number;
} {
  const priced = lines.map((l) => {
    const finalPrice = chargePrice(l.price, l.salePrice);
    return { ...l, finalPrice, discounted: finalPrice < l.price };
  });
  const active = priced.filter((l) => l.quantity > 0);
  const subtotal = active.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = active.reduce((s, l) => s + l.finalPrice * l.quantity, 0);
  return { lines: priced, subtotal, total };
}
