import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGE_BYTES = 1_500_000;
const IMAGE_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

export type StoredImage = { data: Buffer; type: string };

/** Đọc file ảnh đã được thu nhỏ ở trình duyệt. */
export async function readUploadedImage(
  value: FormDataEntryValue | null,
): Promise<StoredImage | { error: string }> {
  if (!(value instanceof File) || value.size === 0) return { error: "Chưa chọn ảnh." };
  if (!IMAGE_TYPES.has(value.type)) return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WebP." };
  if (value.size > MAX_IMAGE_BYTES) return { error: "Ảnh vẫn lớn hơn 1,5 MB. Hãy chọn ảnh khác." };
  return { data: Buffer.from(await value.arrayBuffer()), type: value.type };
}

function extension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Lưu ảnh ra kho. Có BLOB_READ_WRITE_TOKEN thì dùng Vercel Blob (bản deploy).
 * Không có token thì lưu vào public/uploads, cùng một hàm gọi từ app.
 */
export async function storeImage(folder: string, data: Buffer, type: string): Promise<string> {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension(type)}`;
  const pathname = `${folder}/${name}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(pathname, data, { access: "public", contentType: type, token });
    return blob.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
  return `/uploads/${folder}/${name}`;
}

export async function removeStoredImage(url: string | null): Promise<void> {
  if (!url) return;
  const local = localUploadPath(url);
  if (local) {
    await unlink(local).catch(() => {});
    return;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && url.includes(".blob.vercel-storage.com")) {
    await del(url, { token }).catch(() => {});
  }
}

function localUploadPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const root = path.resolve(process.cwd(), "public", "uploads");
  const abs = path.resolve(process.cwd(), "public", url.slice(1));
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}
