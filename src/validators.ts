import { InvalidConfigurationError } from "./error.js";
import { getExtension } from "./helpers.js";
import { UploadConfig } from "./types.js";

export function validateUploaderConfig(config: UploadConfig): void {
  const {
    fieldName,
    allowedExtensions,
    sizeConfig,
    multiple,
    maxFiles,
    partialUpload,
    folderConfig,
    compressImage: shouldCompress,
    imageQuality,
  } = config;

  /* ---------------- REQUIRED ---------------- */

  if (!fieldName || typeof fieldName !== "string") {
    throw new InvalidConfigurationError({
      message: "`fieldName` is required and must be a string",
    });
  }

  /* ---------------- MULTIPLE / PARTIAL ---------------- */

  if (partialUpload && !multiple) {
    throw new InvalidConfigurationError({
      message: "`partialUpload` can only be used when `multiple` is true",
      info: { partialUpload, multiple },
    });
  }

  if (maxFiles !== undefined && !multiple) {
    throw new InvalidConfigurationError({
      message: "`maxFiles` can only be used when `multiple` is true",
      info: { maxFiles, multiple },
    });
  }

  if (multiple && maxFiles !== undefined && maxFiles <= 0) {
    throw new InvalidConfigurationError({
      message: "`maxFiles` must be greater than 0",
      info: { maxFiles },
    });
  }

  /* ---------------- EXTENSIONS ---------------- */

  if (
    allowedExtensions &&
    (!Array.isArray(allowedExtensions) || allowedExtensions.length === 0)
  ) {
    throw new InvalidConfigurationError({
      message: "`allowedExtensions` must be a non-empty array if provided",
      info: { allowedExtensions },
    });
  }

  /* ---------------- SIZE CONFIG ---------------- */

  if (sizeConfig?.enabled) {
    if (!sizeConfig.defaultMB && !sizeConfig.perExtensionMB) {
      throw new InvalidConfigurationError({
        message: "`sizeConfig.enabled` is true but no size limits are defined",
        info: { sizeConfig },
      });
    }

    if (sizeConfig.defaultMB !== undefined && sizeConfig.defaultMB <= 0) {
      throw new InvalidConfigurationError({
        message: "`sizeConfig.defaultMB` must be > 0",
        info: { defaultMB: sizeConfig.defaultMB },
      });
    }

    if (sizeConfig.perExtensionMB) {
      for (const [ext, size] of Object.entries(sizeConfig.perExtensionMB)) {
        if (size <= 0) {
          throw new InvalidConfigurationError({
            message: `Invalid size for extension "${ext}"`,
            info: { extension: ext, sizeMB: size },
          });
        }
      }
    }
  }

  /* ---------------- FOLDER CONFIG ---------------- */

  if (folderConfig?.byCategory && !folderConfig.extensionMap) {
    throw new InvalidConfigurationError({
      message: "`folderConfig.byCategory` requires `extensionMap`",
      info: { folderConfig },
    });
  }

  if (
    folderConfig?.extensionMap &&
    typeof folderConfig.extensionMap !== "object"
  ) {
    throw new InvalidConfigurationError({
      message: "`extensionMap` must be an object",
      info: { extensionMap: folderConfig.extensionMap },
    });
  }

  /* ---------------- IMAGE COMPRESSION ---------------- */

  if (shouldCompress) {
    if (
      imageQuality !== undefined &&
      (imageQuality < 1 || imageQuality > 100)
    ) {
      throw new InvalidConfigurationError({
        message: "`imageQuality` must be between 1 and 100",
        info: { imageQuality },
      });
    }
  }
}

export function validateExtension(
  file: Express.Multer.File,
  allowed?: string[]
): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(getExtension(file));
}