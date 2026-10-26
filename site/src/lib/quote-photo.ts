export const photoTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxOriginalPhotoBytes = 10 * 1024 * 1024;
export const maxUploadPhotoBytes = 3 * 1024 * 1024;

/** Prepare a smaller photo locally; nothing is uploaded until quote submission. */
export async function prepareQuotePhoto(file: File): Promise<File> {
  if (!photoTypes.includes(file.type)) throw new Error("Choose a JPG, PNG or WebP photo.");
  if (!file.size || file.size > maxOriginalPhotoBytes) throw new Error("Choose a photo smaller than 10 MB.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This photo could not be opened. Try another JPG, PNG or WebP image."); }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The photo could not be prepared. Try another image or continue without a photo.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!image || image.size > maxUploadPhotoBytes) throw new Error("This photo is too large to send. Please choose a smaller image.");
    return new File([image], "quote-photo.jpg", { type: "image/jpeg" });
  } finally { bitmap.close(); }
}
