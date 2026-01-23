import {
  DomainBlockedError,
  DomainNotAllowedError,
  InvalidConfigurationError,
  InvalidUrlError,
  SuspiciousFileNameError,
} from "./error.js";
import { getExtension } from "./helpers.js";
import { UploadConfig, UrlUploadConfig } from "./types.js";

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
  allowed?: string[],
): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(getExtension(file));
}

/**
 * Validates URL format and protocol
 */
export function validateUrl(urlString: string): URL {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    throw new InvalidUrlError({
      message: "Invalid URL format",
      info: { url: urlString },
    });
  }

  // Only allow http and https
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new InvalidUrlError({
      message: "Only HTTP and HTTPS protocols are allowed",
      info: {
        url: urlString,
        protocol: url.protocol,
        allowedProtocols: ["http:", "https:"],
      },
    });
  }

  return url;
}

/**
 * Validates domain against whitelist AND/OR blacklist
 *
 * Logic:
 * 1. If blacklist exists and domain is blacklisted -> REJECT
 * 2. If whitelist exists and domain is NOT whitelisted -> REJECT
 * 3. Otherwise -> ALLOW
 */
export function validateDomain(
  url: URL,
  allowedDomains?: string[],
  blockedDomains?: string[],
): void {
  const hostname = url.hostname.toLowerCase();

  // ============================================================================
  // STEP 1: CHECK BLACKLIST (takes priority)
  // ============================================================================
  if (blockedDomains && blockedDomains.length > 0) {
    const isBlocked = blockedDomains.some((domain) => {
      const lowerDomain = domain.toLowerCase();
      // Exact match or subdomain match
      return hostname === lowerDomain || hostname.endsWith(`.${lowerDomain}`);
    });

    if (isBlocked) {
      throw new DomainBlockedError({
        message: `Domain '${url.hostname}' is blocked`,
        info: {
          domain: url.hostname,
          blockedDomains: blockedDomains,
        },
      });
    }
  }

  // ============================================================================
  // STEP 2: CHECK WHITELIST (only if whitelist is defined)
  // ============================================================================
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some((domain) => {
      const lowerDomain = domain.toLowerCase();
      // Exact match or subdomain match
      return hostname === lowerDomain || hostname.endsWith(`.${lowerDomain}`);
    });

    if (!isAllowed) {
      throw new DomainNotAllowedError({
        message: `Domain '${url.hostname}' is not allowed`,
        info: {
          domain: url.hostname,
          allowedDomains: allowedDomains,
        },
      });
    }
  }

  // If neither whitelist nor blacklist is defined, or domain passes both checks -> ALLOW
}

/**
 * Validates and sanitizes filename from URL
 */
export function validateAndSanitizeFilename(url: URL): string {
  const pathname = url.pathname;
  let filename = pathname.split("/").pop() || "";

  // If no filename in URL, generate one
  if (!filename || filename === "" || filename === "/") {
    filename = `download-${Date.now()}`;
  }

  // Remove query parameters
  filename = filename.split("?")[0];

  // Remove dangerous characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Check for path traversal attempts
  if (filename.includes("..") || filename.startsWith(".")) {
    throw new SuspiciousFileNameError({
      message: "Suspicious filename pattern detected",
      info: {
        originalFilename: pathname.split("/").pop(),
        sanitizedFilename: filename,
        reason: "Path traversal attempt",
      },
    });
  }

  // Check for empty filename after sanitization
  if (!filename || filename.length === 0) {
    filename = `download-${Date.now()}`;
  }

  // Limit filename length
  if (filename.length > 255) {
    const ext = filename.substring(filename.lastIndexOf("."));
    filename = filename.substring(0, 255 - ext.length) + ext;
  }

  return filename;
}

/**
 * Validates URL upload configuration
 */
export function validateUrlUploadConfig(config: UrlUploadConfig): void {
  if (!config.enabled) {
    return; // URL upload is disabled, no need to validate
  }

  // Validate maxSizeMB
  if (config.maxSizeMB !== undefined && config.maxSizeMB <= 0) {
    throw new InvalidConfigurationError({
      message: "`urlUpload.maxSizeMB` must be greater than 0",
      info: { maxSizeMB: config.maxSizeMB },
    });
  }

  // Validate timeout
  if (config.timeout !== undefined && config.timeout <= 0) {
    throw new InvalidConfigurationError({
      message: "`urlUpload.timeout` must be greater than 0",
      info: { timeout: config.timeout },
    });
  }

  // Validate maxRedirects
  if (config.maxRedirects !== undefined && config.maxRedirects < 0) {
    throw new InvalidConfigurationError({
      message: "`urlUpload.maxRedirects` must be >= 0",
      info: { maxRedirects: config.maxRedirects },
    });
  }

  // Validate allowedDomains format
  if (config.allowedDomains) {
    if (!Array.isArray(config.allowedDomains)) {
      throw new InvalidConfigurationError({
        message: "`urlUpload.allowedDomains` must be an array",
        info: { allowedDomains: config.allowedDomains },
      });
    }

    // Check each domain for validity
    config.allowedDomains.forEach((domain) => {
      if (typeof domain !== "string" || domain.trim().length === 0) {
        throw new InvalidConfigurationError({
          message: "Each domain in `allowedDomains` must be a non-empty string",
          info: { invalidDomain: domain },
        });
      }
    });
  }
}

/**
 * Update existing validateUploaderConfig to include URL upload validation
 * ADD THIS TO THE EXISTING validateUploaderConfig FUNCTION
 */
export function validateUploaderConfigWithUrl(config: UploadConfig): void {
  // Call existing validation
  validateUploaderConfig(config);

  // Validate URL upload config if present
  if (config.urlUpload) {
    validateUrlUploadConfig(config.urlUpload);
  }
}
