import fs from "fs";

export function cleanupFile(file?: Express.Multer.File) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

export function cleanupFiles(files?: Express.Multer.File[]) {
  if (!files) return;
  files.forEach(cleanupFile);
}