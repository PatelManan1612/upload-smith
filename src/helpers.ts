import fs from "fs";
import path from "path";
import { FolderConfig, SizeConfig } from "./types.js";
import multer from "multer";
import {
  FileSizeExceededError,
  InvalidFieldNameError,
  TooManyFilesError,
} from "./error.js";

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getExtension(file: Express.Multer.File): string {
  return path.extname(file.originalname).replace(".", "").toLowerCase();
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

export function getMulterLimit(err: any): number | undefined {
  return typeof err?.limit === "number" ? err.limit : undefined;
}

export function mapMulterError(
  err: unknown,
  fieldName?: string,
  options?: {
    maxFiles?: number;
  }
): Error {
  if (!(err instanceof multer.MulterError)) {
    return err as Error;
  }

  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return new FileSizeExceededError({
        info: {
          maxSize: getMulterLimit(err),
        },
      });

    case "LIMIT_FILE_COUNT":
      return new TooManyFilesError({
        info: {
          maxFiles: getMulterLimit(err),
        },
      });

    case "LIMIT_UNEXPECTED_FILE":
      // 🔥 IMPORTANT LOGIC
      if (fieldName === err?.field && options?.maxFiles) {
        return new TooManyFilesError({
          info: {
            maxFiles: options?.maxFiles,
            receivedField: err.field,
          },
        });
      }

      return new InvalidFieldNameError({
        info: {
          expectedField: fieldName,
          receivedField: err.field,
        },
      });

    default:
      return err as Error;
  }
}
