"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(register, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="label">
          Tên của bạn
        </label>
        <input id="name" name="name" className="input" placeholder="Nguyễn Văn A" maxLength={80} required />
      </div>
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          name="username"
          className="input"
          placeholder="vd: nguyenvana"
          autoComplete="username"
          autoCapitalize="none"
          pattern="[a-zA-Z0-9_.]{3,32}"
          title="3–32 ký tự: chữ không dấu, số, dấu _ hoặc ."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="label">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Xác nhận
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3" pendingText="Đang tạo tài khoản…">
        Tạo tài khoản
      </SubmitButton>
    </form>
  );
}
