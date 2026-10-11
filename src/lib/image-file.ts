/** Thu nhỏ ảnh trên trình duyệt trước khi gửi lên server. */
export async function prepareImage(
  file: File,
  { maxEdge, square = false }: { maxEdge: number; square?: boolean },
): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");

  if (square) {
    const side = Math.min(bitmap.width, bitmap.height);
    const edge = Math.min(maxEdge, side);
    canvas.width = edge;
    canvas.height = edge;
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      edge,
      edge,
    );
  } else {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();

  const blob = await encode(canvas);
  if (!blob) throw new Error("encode");
  return new File([blob], "image", { type: blob.type });
}

async function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  for (const quality of [0.82, 0.68, 0.55]) {
    const blob = await toBlob(canvas, "image/webp", quality);
    if (blob && blob.size <= 1_200_000) return blob;
  }
  return toBlob(canvas, "image/jpeg", 0.7);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
