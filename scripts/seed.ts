import "./env";
import { db } from "../src/db";
import { menuItems } from "../src/db/schema";

const sample: (typeof menuItems.$inferInsert)[] = [
  { name: "Cơm gà xối mỡ", category: "food", price: 45000, description: "Gà giòn, cơm chiên, dưa leo" },
  { name: "Cơm sườn nướng", category: "food", price: 45000, description: "Sườn cốt lết, bì, chả trứng" },
  { name: "Cơm bò lúc lắc", category: "food", price: 55000, description: "Bò mềm, ớt chuông, hành tây" },
  { name: "Cơm cá kho tộ", category: "food", price: 40000, description: "Cá basa kho tiêu, canh rau" },
  { name: "Trà đá", category: "drink", price: 5000 },
  { name: "Trà tắc", category: "drink", price: 15000 },
  { name: "Cà phê sữa đá", category: "drink", price: 25000 },
  { name: "Nước cam ép", category: "drink", price: 30000 },
];

async function main() {
  const existing = await db.select({ id: menuItems.id }).from(menuItems).limit(1);
  if (existing.length > 0) {
    console.log("Menu đã có dữ liệu, bỏ qua seed.");
    process.exit(0);
  }
  await db.insert(menuItems).values(sample);
  console.log(`✓ Đã thêm ${sample.length} món mẫu`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
