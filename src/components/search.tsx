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
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
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
