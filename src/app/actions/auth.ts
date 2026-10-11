"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { createSession, deleteSession } from "@/lib/session";
import { readUploadedImage, removeStoredImage, storeImage } from "@/lib/storage";

const USERNAME_RE = /^[a-z0-9_.]{3,32}$/;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Vui lòng nhập username và mật khẩu." };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Username hoặc mật khẩu không đúng." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!USERNAME_RE.test(username)) {
    return { error: "Username 3–32 ký tự, chỉ gồm chữ thường không dấu, số, dấu _ hoặc ." };
  }
  if (name.length < 1 || name.length > 80) return { error: "Vui lòng nhập tên của bạn." };
  if (password.length < 6) return { error: "Mật khẩu tối thiểu 6 ký tự." };
  if (password !== confirm) return { error: "Mật khẩu xác nhận không khớp." };

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ username, name, passwordHash })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id });
  if (!created) return { error: "Username đã có người dùng." };

  await createSession(created.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function updateName(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 80) return { error: "Vui lòng nhập họ tên." };
  if (name === user.name) return { success: "Họ tên không thay đổi." };

  await db.update(users).set({ name }).where(eq(users.id, user.id));
  refresh();
  return { success: "Đã lưu họ tên." };
}

export async function setAvatar(formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const image = await readUploadedImage(formData.get("file"));
  if ("error" in image) return image;

  const [row] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.id));
  const url = await storeImage("avatars", image.data, image.type);
  await db.update(users).set({ avatarUrl: url }).where(eq(users.id, user.id));
  await removeStoredImage(row?.avatarUrl ?? null);
  refresh();
  return { success: "Đã đổi ảnh đại diện." };
}

export async function clearAvatar() {
  const user = await requireUser();
  const [row] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.id));
  if (!row?.avatarUrl) return;
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, user.id));
  await removeStoredImage(row.avatarUrl);
  refresh();
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) return { error: "Mật khẩu mới tối thiểu 6 ký tự." };
  if (password !== confirm) return { error: "Mật khẩu xác nhận không khớp." };

  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, user.id));
  refresh();
  return { success: "Đã đổi mật khẩu." };
}
