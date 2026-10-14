import "./env";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { roleEnum, users, type Role } from "../src/db/schema";

async function main() {
  const [username, role] = process.argv.slice(2);
  if (!username || !roleEnum.enumValues.includes(role as Role)) {
    console.error("Cách dùng: npm run set-role -- <username> <user|staff|admin|owner>");
    process.exit(1);
  }
  const updated = await db
    .update(users)
    .set({ role: role as Role })
    .where(eq(users.username, username.toLowerCase()))
    .returning({ id: users.id });
  if (updated.length === 0) {
    console.error(`Không tìm thấy username "${username}"`);
    process.exit(1);
  }
  console.log(`✓ ${username} giờ có role ${role}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
