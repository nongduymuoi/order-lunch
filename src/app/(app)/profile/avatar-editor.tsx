"use client";

import { useRef, useState, useTransition } from "react";
import { clearAvatar, setAvatar } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { UserAvatar } from "@/components/user-avatar";
import type { FormState } from "@/lib/form-state";
import { prepareImage } from "@/lib/image-file";

export function AvatarEditor({ name, url }: { name: string; url: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  function onPick(file: File | undefined) {
    if (!file) return;
    setState(null);
    startTransition(async () => {
      try {
        const prepared = await prepareImage(file, { maxEdge: 512, square: true });
        const formData = new FormData();
        formData.set("file", prepared);
        setState(await setAvatar(formData));
      } catch {
        setState({ error: "Không đọc được ảnh này. Hãy chọn JPEG, PNG hoặc WebP." });
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className="relative rounded-full focus-visible:ring-4 focus-visible:ring-royal-200"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        aria-label="Đổi ảnh đại diện"
      >
        <UserAvatar
          name={name}
          url={url}
          className="size-24 rounded-full bg-gradient-to-br from-royal-500 to-navy-800 text-3xl text-white shadow-lift"
        />
        <span className="absolute inset-0 flex items-end justify-center rounded-full bg-navy-950/0 pb-2 text-[0.65rem] font-semibold text-white opacity-0 transition hover:bg-navy-950/35 hover:opacity-100">
          {pending ? "…" : "Đổi"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className="mt-3 text-xs text-muted">Bấm vào ảnh để đổi</p>
      {url && (
        <form action={clearAvatar} className="mt-2">
          <SubmitButton className="btn-ghost btn-sm" pendingText="Đang gỡ…">
            Gỡ ảnh
          </SubmitButton>
        </form>
      )}
      <FormMessage state={state} />
    </div>
  );
}
