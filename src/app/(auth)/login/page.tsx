import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập — Đặt Cơm" };

export default function LoginPage() {
  return (
    <>
      <p className="eyebrow mb-3">Chào mừng trở lại</p>
      <h1 className="font-display text-4xl font-semibold text-navy-900">Đăng nhập</h1>
      <p className="mt-2 mb-8 text-sm text-muted">Dùng username và mật khẩu đã đăng ký.</p>
      <LoginForm />
      <p className="mt-8 text-center text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-royal-600 hover:text-royal-700">
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}
