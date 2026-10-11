import Image from "next/image";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className: string;
}) {
  if (url) {
    return (
      <span className={`relative inline-block overflow-hidden ${className}`}>
        <Image src={url} alt="" fill unoptimized sizes="96px" className="object-cover" />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center font-display font-semibold ${className}`}>
      {initials(name) || "?"}
    </span>
  );
}
