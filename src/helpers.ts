import fs from "fs";
import path from "path";
import { FolderConfig, SizeConfig } from "./types.js";
import { getExtension } from "./validators.js";

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function resolveUploadPath(
  file: Express.Multer.File,
  folder?: FolderConfig
): string {
  const ext = getExtension(file);
  const base = folder?.basePath ?? "uploads";
  let finalPath = base;

  if (folder?.byCategory && folder.extensionMap) {
    finalPath = path.join(base, folder.extensionMap[ext] ?? "others");
  }

  if (folder?.byExtension) {
    finalPath = path.join(finalPath, ext);
  }

  if (folder?.autoCreate !== false) {
    ensureDir(finalPath);
  }

  return finalPath;
}

export function resolveFileSizeLimit(
  file: Express.Multer.File,
  sizeConfig?: SizeConfig
): number {
  if (!sizeConfig?.enabled) {
    return (sizeConfig?.defaultMB ?? 5) * 1024 * 1024;
  }

  const ext = getExtension(file);
  const limit = sizeConfig.perExtensionMB?.[ext] ?? sizeConfig.defaultMB ?? 5;

  return limit * 1024 * 1024;
}
