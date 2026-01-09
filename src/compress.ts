import sharp from "sharp";
import fs from "fs";
import path from "path";

const SUPPORTED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "tiff",
  "gif",
];
const IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/gif",
];

export function isCompressibleImage(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).replace(".", "").toLowerCase();

  // Primary check: extension
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
    // Secondary safety check: mimetype (if available)
    if (file.mimetype) {
      return IMAGE_MIMETYPES.includes(file.mimetype);
    }
    return true;
  }

  // Check mimetype as fallback
  if (file.mimetype && IMAGE_MIMETYPES.includes(file.mimetype)) {
    return true;
  }

  return false;
}

export async function compressImage(file: Express.Multer.File, quality = 80) {
  // Skip if not an image
  if (!isCompressibleImage(file)) {
    return;
  }

  try {
    const ext = path.extname(file.filename).replace(".", "").toLowerCase();
    const compressedPath = file.path.replace(
      path.extname(file.path),
      `-compressed.${ext}`
    );

    // Determine output format
    let format: keyof sharp.FormatEnum = "jpeg";
    if (ext === "png") format = "png";
    else if (ext === "webp") format = "webp";
    else if (ext === "jpg" || ext === "jpeg") format = "jpeg";

    await sharp(file.path).toFormat(format, { quality }).toFile(compressedPath);

    // Replace original with compressed
    fs.unlinkSync(file.path);

    file.path = compressedPath;
    file.filename = path.basename(compressedPath);
  } catch (error) {
    // If compression fails, keep the original file
    console.error(`Failed to compress image ${file.originalname}:`, error);
  }
}
