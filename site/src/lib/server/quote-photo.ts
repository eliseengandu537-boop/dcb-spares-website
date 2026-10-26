import sharp from "sharp";
import { maxUploadPhotoBytes, photoTypes } from "../quote-photo";

export type QuotePhotoAttachment = { filename: string; content: Buffer; contentType: "image/jpeg" };
export class InvalidQuotePhoto extends Error {}

export async function readQuotePhoto(file: File, bytes: Buffer): Promise<QuotePhotoAttachment> {
  if (!photoTypes.includes(file.type) || !file.size || file.size > maxUploadPhotoBytes) {
    throw new InvalidQuotePhoto("Choose a JPG, PNG or WebP photo and try again.");
  }
  try {
    const type = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "image/jpeg"
      : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "";
    if (type !== file.type) throw new Error("Unsupported image");
    const image = sharp(bytes, { limitInputPixels: 25_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
    // Re-encode without original filenames, EXIF/location data, or other metadata.
    const content = await image.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
    if (content.length > maxUploadPhotoBytes) throw new Error("Image too large");
    return { filename: "quote-photo.jpg", content, contentType: "image/jpeg" };
  } catch { throw new InvalidQuotePhoto("This photo could not be read. Choose another image, or remove it and continue."); }
}
