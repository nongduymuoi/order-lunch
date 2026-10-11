export const TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_DEADLINE = "10:30";

// Việt Nam không có giờ mùa hè nên offset luôn là +07:00.
const VN_OFFSET = "+07:00";

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function deadlineAt(dateISO: string, hhmm: string): Date {
  return new Date(`${dateISO}T${hhmm}:00${VN_OFFSET}`);
}

export function toHHMM(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDate(dateISO: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateISO}T12:00:00${VN_OFFSET}`));
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function isPast(d: Date): boolean {
  return Date.now() > d.getTime();
}

export function isValidHHMM(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
