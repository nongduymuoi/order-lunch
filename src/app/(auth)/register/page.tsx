import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Đăng ký — Mộc" };

export default function RegisterPage() {
  return (
    <>
      <p className="eyebrow mb-3">Tài khoản mới</p>
      <h1 className="font-display text-4xl font-semibold text-navy-900">Đăng ký</h1>
      <p className="mt-2 mb-8 text-sm text-muted">Chỉ mất vài giây để bắt đầu đặt cơm.</p>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-royal-600 hover:text-royal-700">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
