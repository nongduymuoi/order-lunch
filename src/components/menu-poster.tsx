"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function MenuPoster({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-2xl border border-line bg-mist text-left shadow-card"
      >
        <span className="relative block h-72 w-full">
          <Image
            src={src}
            alt="Menu món ăn hôm nay"
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-contain"
          />
        </span>
        <span className="block px-4 py-2 text-center text-xs font-semibold text-royal-700 group-hover:text-royal-600">
          Bấm để xem ảnh lớn
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-navy-950/80 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh menu món ăn"
        >
          <span className="relative block h-[92vh] w-full max-w-5xl">
            <Image
              src={src}
              alt="Menu món ăn hôm nay"
              fill
              unoptimized
              sizes="100vw"
              className="rounded-xl object-contain"
            />
          </span>
        </div>
      )}
    </>
  );
}
