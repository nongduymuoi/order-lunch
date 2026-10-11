"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateName, updatePassword } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function NameForm({ username, name }: { username: string; name: string }) {
  const [state, action] = useActionState(updateName, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input id="username" value={username} className="input bg-mist text-muted" disabled readOnly />
        <p className="mt-1.5 text-xs text-muted">Username không thể thay đổi.</p>
      </div>
      <div>
        <label htmlFor="name" className="label">
          Họ tên
        </label>
        <input
          id="name"
          name="name"
          className="input"
          defaultValue={name}
          maxLength={80}
          autoComplete="name"
          required
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Đang lưu…">Lưu thông tin</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(updatePassword, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="label">
            Mật khẩu mới
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={6}
            placeholder="Tối thiểu 6 ký tự"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Xác nhận mật khẩu mới
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
      <SubmitButton pendingText="Đang lưu…">Đổi mật khẩu</SubmitButton>
    </form>
  );
}
