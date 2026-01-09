import path from "path";

export function getExtension(file: Express.Multer.File): string {
  return path.extname(file.originalname).replace(".", "").toLowerCase();
}

export function validateExtension(
  file: Express.Multer.File,
  allowed?: string[]
): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(getExtension(file));
}