"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { matchesQuery } from "@/lib/text";

const SearchContext = createContext("");

/** Bao quanh vùng cần lọc; ô tìm kiếm và các dòng bên trong dùng chung một từ khóa. */
export function SearchScope({
  children,
  placeholder = "Tìm món theo tên…",
  className = "",
}: {
  children: ReactNode;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  return (
    <SearchContext value={query}>
      <SearchBox value={query} onChange={setQuery} placeholder={placeholder} className={className} />
      {children}
    </SearchContext>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Tìm món theo tên…",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-royal-300 bg-royal-50 p-3 shadow-card ${className}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-royal-700">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden>
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
        </svg>
        Tìm món
      </p>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input border-royal-200 bg-white text-base placeholder:text-navy-700/40"
        aria-label={placeholder}
      />
    </div>
  );
}

type ItemTag = "li" | "tr" | "div" | "section";

/** Ẩn (không gỡ) phần tử không khớp, để form bên trong giữ nguyên giá trị đang nhập. */
export function SearchItem({
  text,
  as: Tag = "div",
  className,
  children,
}: {
  text: string;
  as?: ItemTag;
  className?: string;
  children: ReactNode;
}) {
  const query = use(SearchContext);
  return (
    <Tag className={className} hidden={!matchesQuery(text, query)}>
      {children}
    </Tag>
  );
}
