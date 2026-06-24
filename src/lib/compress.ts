// Kompresi gambar client-side sebelum upload ke Firebase Storage
// Mengurangi ukuran file hingga 80% tanpa kehilangan kualitas yang berarti
// ================================================================

export type CompressOptions = {
  maxWidth?: number;       // max width, default 1920
  maxHeight?: number;      // max height, default 1920
  quality?: number;        // 0.0 - 1.0, default 0.8
  maxSizeKB?: number;      // target maksimum dalam KB, default 400
  fast?: boolean;          // mode cepat, default false
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxSizeKB = 400,
    fast = false
  } = options;

  // Mode cepat: target lebih kecil, kompresi lebih agresif
  const targetMaxWidth = fast ? 1400 : maxWidth;
  const targetMaxHeight = fast ? 1400 : maxHeight;
  const targetQuality = fast ? 0.75 : quality;
  const targetMaxSizeKB = fast ? 250 : maxSizeKB;

  // Kalau file sudah kecil, jangan kompres
  if (file.size < 50 * 1024) return file;

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");

  let w = img.width;
  let h = img.height;

  // Scale down kalau terlalu besar
  if (w > targetMaxWidth) { h = (h * targetMaxWidth) / w; w = targetMaxWidth; }
  if (h > targetMaxHeight) { w = (w * targetMaxHeight) / h; h = targetMaxHeight; }

  // Mode cepat: pakai ukuran lebih kecil lagi untuk upload kilat
  if (fast && w > 1200) {
    const scale = 1200 / w;
    w = 1200;
    h = h * scale;
  }

  canvas.width = Math.round(w);
  canvas.height = Math.round(h);

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = fast ? "medium" : "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Coba kualitas awal
  let blob = await canvasToBlob(canvas, targetQuality);

  // Mode cepat: langsung return kalau sudah cukup kecil
  if (fast && blob.size < targetMaxSizeKB * 1024) {
    console.log(
      `[Kompresi Cepat] ${formatSize(file.size)} → ${formatSize(blob.size)}`
    );
    return new File([blob], file.name, { type: file.type || "image/jpeg", lastModified: Date.now() });
  }

  let currentQuality = targetQuality;
  let attempts = 0;
  const maxAttempts = fast ? 2 : 5;

  while (blob.size > targetMaxSizeKB * 1024 && currentQuality > 0.35 && attempts < maxAttempts) {
    currentQuality -= fast ? 0.15 : 0.1;
    blob = await canvasToBlob(canvas, currentQuality);
    attempts++;
  }

  // Fallback terakhir: resize lebih kecil lagi
  if (blob.size > targetMaxSizeKB * 1024 && currentQuality <= 0.35) {
    const scaleDown = Math.sqrt((targetMaxSizeKB * 1024) / blob.size);
    canvas.width = Math.round(canvas.width * scaleDown);
    canvas.height = Math.round(canvas.height * scaleDown);
    const ctx2 = canvas.getContext("2d")!;
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = "medium";
    ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, 0.7);
  }

  console.log(
    `[Kompresi${fast ? ' Cepat' : ''}] ${formatSize(file.size)} → ${formatSize(blob.size)} (${Math.round((1 - blob.size/file.size)*100)}% lebih kecil)`
  );

  return new File([blob], file.name, { type: file.type || "image/jpeg", lastModified: Date.now() });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob gagal"));
      },
      "image/jpeg",
      quality
    );
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
