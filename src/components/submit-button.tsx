"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
