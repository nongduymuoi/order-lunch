"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setTodayMenuItem } from "@/app/actions/admin";

export function TodayMenuSwitch({ menuItemId, on }: { menuItemId: number; on: boolean }) {
  const [optimisticOn, setOptimisticOn] = useOptimistic(on);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticOn;
    setNotice(null);
    startTransition(async () => {
      setOptimisticOn(next);
      const result = await setTodayMenuItem(menuItemId, next);
      setNotice(result.notice ?? null);
      if (result.on !== next) setOptimisticOn(result.on);
    });
  }

  return (
    <div className="mr-auto flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={optimisticOn}
        aria-label={optimisticOn ? "Đang có trong menu hôm nay" : "Chưa có trong menu hôm nay"}
        disabled={pending}
        onClick={toggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal-100 disabled:cursor-wait ${
          optimisticOn ? "bg-royal-600" : "bg-[#cfc4b4]"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow-[0_1px_2px_rgb(36_28_22/0.25)] transition-transform duration-200 ${
            optimisticOn ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="min-w-0">
        <span className={`block text-xs font-semibold ${optimisticOn ? "text-royal-700" : "text-muted"}`}>
          {optimisticOn ? "Có trong menu hôm nay" : "Không có hôm nay"}
        </span>
        {notice && <span className="mt-0.5 block text-xs text-rose-600">{notice}</span>}
      </span>
    </div>
  );
}
