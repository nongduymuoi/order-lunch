"use client";

import { useRef, useState, useTransition } from "react";
import { clearDayMenuImage, setDayMenuImage } from "@/app/actions/admin";
import { FormMessage } from "@/components/form-message";
import { MenuPoster } from "@/components/menu-poster";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/form-state";
import { prepareImage } from "@/lib/image-file";

export function MenuImageEditor({
  dayId,
  slot,
  title,
  url,
}: {
  dayId: number;
  slot: "food" | "drink";
  title: string;
  url: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();
  const alt = slot === "drink" ? "Menu nước hôm nay" : "Menu cơm hôm nay";

  function onPick(file: File | undefined) {
    if (!file) return;
    setState(null);
    startTransition(async () => {
      try {
        const prepared = await prepareImage(file, { maxEdge: 1600 });
        const formData = new FormData();
        formData.set("dayId", String(dayId));
        formData.set("slot", slot);
        formData.set("file", prepared);
        setState(await setDayMenuImage(formData));
      } catch {
        setState({ error: "Không đọc được ảnh này. Hãy chọn JPEG, PNG hoặc WebP." });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-mist/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-navy-900">{title}</h3>
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
              <input type="hidden" name="slot" value={slot} />
              <SubmitButton className="btn-ghost btn-sm" pendingText="Đang gỡ…">
                Gỡ ảnh
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
      {url ? (
        <MenuPoster src={url} alt={alt} />
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
          Chưa có ảnh cho hôm nay.
        </p>
      )}
      <FormMessage state={state} />
    </div>
  );
}
