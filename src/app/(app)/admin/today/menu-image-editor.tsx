"use client";

import { useRef, useState, useTransition } from "react";
import { clearDayMenuImage, setDayMenuImage } from "@/app/actions/admin";
import { FormMessage } from "@/components/form-message";
import { MenuPoster } from "@/components/menu-poster";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/form-state";
import { prepareImage } from "@/lib/image-file";

export function MenuImageEditor({ dayId, url }: { dayId: number; url: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  function onPick(file: File | undefined) {
    if (!file) return;
    setState(null);
    startTransition(async () => {
      try {
        const prepared = await prepareImage(file, { maxEdge: 1600 });
        const formData = new FormData();
        formData.set("dayId", String(dayId));
        formData.set("file", prepared);
        setState(await setDayMenuImage(formData));
      } catch {
        setState({ error: "Không đọc được ảnh này. Hãy chọn JPEG, PNG hoặc WebP." });
      }
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-mist/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy-900">Ảnh menu món ăn</h3>
          <p className="mt-0.5 text-xs text-muted">Một ảnh cho món ăn hôm nay. Đồ uống không dùng ảnh này.</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Đang lưu…" : url ? "Đổi ảnh" : "Thêm ảnh"}
          </button>
          {url && (
            <form action={clearDayMenuImage}>
              <input type="hidden" name="dayId" value={dayId} />
              <SubmitButton className="btn-ghost btn-sm" pendingText="Đang gỡ…">
                Gỡ ảnh
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
      {url ? (
        <MenuPoster src={url} />
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
          Chưa có ảnh menu món ăn cho hôm nay.
        </p>
      )}
      <FormMessage state={state} />
    </div>
  );
}
