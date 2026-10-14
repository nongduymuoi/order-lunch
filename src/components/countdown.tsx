"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FOOD_CLOSED_MESSAGE } from "@/lib/format";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ deadline }: { deadline: string }) {
  const router = useRouter();
  const target = new Date(deadline).getTime();
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : target - now;

  useEffect(() => {
    if (left !== null && left <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [left, router]);

  if (left === null) {
    return <div className="h-16" aria-hidden />;
  }

  if (left <= 0) {
    return (
      <p className="max-w-xl font-display text-2xl leading-snug font-semibold text-white sm:text-3xl">
        {FOOD_CLOSED_MESSAGE}
      </p>
    );
  }

  const { h, m, s } = split(left);
  const urgent = left < 10 * 60 * 1000;
  const units = [
    { v: h, l: "giờ" },
    { v: m, l: "phút" },
    { v: s, l: "giây" },
  ];

  return (
    <div className="flex items-end gap-3" role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.l} className="flex items-end gap-3">
          <div className="text-center">
            <p
              className={`font-display text-4xl font-semibold tabular-nums sm:text-5xl ${urgent ? "text-amber-200" : "text-white"}`}
            >
              {pad(u.v)}
            </p>
            <p className="mt-1 text-[0.65rem] tracking-[0.2em] text-royal-200/70 uppercase">{u.l}</p>
          </div>
          {i < units.length - 1 && (
            <span className="pb-6 font-display text-3xl text-royal-200/40">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
