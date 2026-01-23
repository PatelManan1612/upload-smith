// Error definitions for upload-smith

export const UPLOAD_ERRORS = {
  // File validation errors
  INVALID_FILE_EXTENSION: {
    type: "VALIDATION_ERROR",
    code: "INVALID_FILE_EXTENSION",
    status: 400,
    message: "File extension is not allowed.",
  },

  FILE_SIZE_EXCEEDED: {
    type: "VALIDATION_ERROR",
    code: "FILE_SIZE_EXCEEDED",
    status: 413,
    message: "File size exceeds the allowed limit.",
  },

  TOO_MANY_FILES: {
    type: "VALIDATION_ERROR",
    code: "TOO_MANY_FILES",
    status: 400,
    message: "Too many files uploaded.",
  },

  NO_FILE_UPLOADED: {
    type: "VALIDATION_ERROR",
    code: "NO_FILE_UPLOADED",
    status: 400,
    message: "No file was uploaded.",
  },

  INVALID_FIELD_NAME: {
    type: "VALIDATION_ERROR",
    code: "INVALID_FIELD_NAME",
    status: 400,
    message: "Invalid or unexpected field name.",
  },

  // File processing errors
  COMPRESSION_FAILED: {
    type: "PROCESSING_ERROR",
    code: "COMPRESSION_FAILED",
    status: 500,
    message: "Failed to compress the image.",
  },

  FOLDER_CREATION_FAILED: {
    type: "PROCESSING_ERROR",
    code: "FOLDER_CREATION_FAILED",
    status: 500,
    message: "Failed to create upload directory.",
  },

  FILE_WRITE_FAILED: {
    type: "PROCESSING_ERROR",
    code: "FILE_WRITE_FAILED",
    status: 500,
    message: "Failed to write file to disk.",
  },

  FILE_DELETE_FAILED: {
    type: "PROCESSING_ERROR",
    code: "FILE_DELETE_FAILED",
    status: 500,
    message: "Failed to delete file.",
  },

  // Configuration errors
  INVALID_CONFIGURATION: {
    type: "CONFIGURATION_ERROR",
    code: "INVALID_CONFIGURATION",
    status: 500,
    message: "Invalid uploader configuration.",
  },

  MISSING_FIELD_NAME: {
    type: "CONFIGURATION_ERROR",
    code: "MISSING_FIELD_NAME",
    status: 500,
    message: "Field name is required in configuration.",
  },

  //Upload URL related errors
  INVALID_URL: {
    type: "VALIDATION_ERROR",
    code: "INVALID_URL",
    status: 400,
    message: "Invalid URL format.",
    description:
      "The provided URL is malformed or uses an unsupported protocol.",
  },

  DOMAIN_NOT_ALLOWED: {
    type: "VALIDATION_ERROR",
    code: "DOMAIN_NOT_ALLOWED",
    status: 403,
    message: "Domain is not allowed.",
    description: "The URL domain is not in the allowed domains whitelist.",
  },

  DOMAIN_BLOCKED: {
    type: "VALIDATION_ERROR",
    code: "DOMAIN_BLOCKED",
    status: 403,
    message: "Domain is blocked.",
    description: "The URL domain is on blacklist.",
  },

  SUSPICIOUS_FILE_NAME: {
    type: "SECURITY_ERROR",
    code: "SUSPICIOUS_FILE_NAME",
    status: 400,
    message: "Suspicious file name detected.",
    description:
      "The file name contains patterns that may indicate a security risk (path traversal, etc.).",
  },

  UPLOAD_TIMEOUT: {
    type: "NETWORK_ERROR",
    code: "UPLOAD_TIMEOUT",
    status: 408,
    message: "Upload timeout.",
    description: "The file upload exceeded the maximum allowed time.",
  },

  NETWORK_ERROR: {
    type: "NETWORK_ERROR",
    code: "NETWORK_ERROR",
    status: 500,
    message: "Network error during upload.",
    description: "A network error occurred while uploading the file.",
  },

  TOO_MANY_REDIRECTS: {
    type: "NETWORK_ERROR",
    code: "TOO_MANY_REDIRECTS",
    status: 400,
    message: "Too many redirects.",
    description: "The URL resulted in too many HTTP redirects.",
  },

  HTTP_ERROR: {
    type: "NETWORK_ERROR",
    code: "HTTP_ERROR",
    status: 400,
    message: "HTTP request failed.",
    description:
      "The HTTP request to download the file failed with an error status.",
  },
} as const;

export type UploadErrorCode = keyof typeof UPLOAD_ERRORS;
export type UploadErrorType = (typeof UPLOAD_ERRORS)[UploadErrorCode]["type"];

export interface UploadErrorInfo {
  type: string;
  code: string;
  status: number;
  message: string;
  info?: Record<string, any>;
}

/**
 * Base upload error class
 */
export class UploadError extends Error {
  public readonly type: string;
  public readonly code: string;
  public readonly status: number;
  public readonly info?: Record<string, any>;

  constructor(errorInfo: UploadErrorInfo) {
    super(errorInfo.message);
    this.name = "UploadError";
    this.type = errorInfo.type;
    this.code = errorInfo.code;
    this.status = errorInfo.status;
    this.info = errorInfo.info;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      status: this.status,
      message: this.message,
      info: this.info,
    };
  }
}

/**
 * File extension validation error
 */
export class InvalidFileExtensionError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.INVALID_FILE_EXTENSION.type,
      code: overrides?.code || UPLOAD_ERRORS.INVALID_FILE_EXTENSION.code,
      status: overrides?.status || UPLOAD_ERRORS.INVALID_FILE_EXTENSION.status,
      message:
        overrides?.message || UPLOAD_ERRORS.INVALID_FILE_EXTENSION.message,
      info: overrides?.info,
    });
    this.name = "InvalidFileExtensionError";
  }
}

/**
 * File size exceeded error
 */
export class FileSizeExceededError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.FILE_SIZE_EXCEEDED.type,
      code: overrides?.code || UPLOAD_ERRORS.FILE_SIZE_EXCEEDED.code,
      status: overrides?.status || UPLOAD_ERRORS.FILE_SIZE_EXCEEDED.status,
      message: overrides?.message || UPLOAD_ERRORS.FILE_SIZE_EXCEEDED.message,
      info: overrides?.info,
    });
    this.name = "FileSizeExceededError";
  }
}

/**
 * Too many files error
 */
export class TooManyFilesError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.TOO_MANY_FILES.type,
      code: overrides?.code || UPLOAD_ERRORS.TOO_MANY_FILES.code,
      status: overrides?.status || UPLOAD_ERRORS.TOO_MANY_FILES.status,
      message: overrides?.message || UPLOAD_ERRORS.TOO_MANY_FILES.message,
      info: overrides?.info,
    });
    this.name = "TooManyFilesError";
  }
}

/**
 * No file uploaded error
 */
export class NoFileUploadedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.NO_FILE_UPLOADED.type,
      code: overrides?.code || UPLOAD_ERRORS.NO_FILE_UPLOADED.code,
      status: overrides?.status || UPLOAD_ERRORS.NO_FILE_UPLOADED.status,
      message: overrides?.message || UPLOAD_ERRORS.NO_FILE_UPLOADED.message,
      info: overrides?.info,
    });
    this.name = "NoFileUploadedError";
  }
}

/**
 * Invalid field name error
 */
export class InvalidFieldNameError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.INVALID_FIELD_NAME.type,
      code: overrides?.code || UPLOAD_ERRORS.INVALID_FIELD_NAME.code,
      status: overrides?.status || UPLOAD_ERRORS.INVALID_FIELD_NAME.status,
      message: overrides?.message || UPLOAD_ERRORS.INVALID_FIELD_NAME.message,
      info: overrides?.info,
    });
    this.name = "InvalidFieldNameError";
  }
}

/**
 * Image compression failed error
 */
export class CompressionFailedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.COMPRESSION_FAILED.type,
      code: overrides?.code || UPLOAD_ERRORS.COMPRESSION_FAILED.code,
      status: overrides?.status || UPLOAD_ERRORS.COMPRESSION_FAILED.status,
      message: overrides?.message || UPLOAD_ERRORS.COMPRESSION_FAILED.message,
      info: overrides?.info,
    });
    this.name = "CompressionFailedError";
  }
}

/**
 * Folder creation failed error
 */
export class FolderCreationFailedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.FOLDER_CREATION_FAILED.type,
      code: overrides?.code || UPLOAD_ERRORS.FOLDER_CREATION_FAILED.code,
      status: overrides?.status || UPLOAD_ERRORS.FOLDER_CREATION_FAILED.status,
      message:
        overrides?.message || UPLOAD_ERRORS.FOLDER_CREATION_FAILED.message,
      info: overrides?.info,
    });
    this.name = "FolderCreationFailedError";
  }
}

/**
 * File write failed error
 */
export class FileWriteFailedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.FILE_WRITE_FAILED.type,
      code: overrides?.code || UPLOAD_ERRORS.FILE_WRITE_FAILED.code,
      status: overrides?.status || UPLOAD_ERRORS.FILE_WRITE_FAILED.status,
      message: overrides?.message || UPLOAD_ERRORS.FILE_WRITE_FAILED.message,
      info: overrides?.info,
    });
    this.name = "FileWriteFailedError";
  }
}

/**
 * File delete failed error
 */
export class FileDeleteFailedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.FILE_DELETE_FAILED.type,
      code: overrides?.code || UPLOAD_ERRORS.FILE_DELETE_FAILED.code,
      status: overrides?.status || UPLOAD_ERRORS.FILE_DELETE_FAILED.status,
      message: overrides?.message || UPLOAD_ERRORS.FILE_DELETE_FAILED.message,
      info: overrides?.info,
    });
    this.name = "FileDeleteFailedError";
  }
}

/**
 * Invalid configuration error
 */
export class InvalidConfigurationError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.INVALID_CONFIGURATION.type,
      code: overrides?.code || UPLOAD_ERRORS.INVALID_CONFIGURATION.code,
      status: overrides?.status || UPLOAD_ERRORS.INVALID_CONFIGURATION.status,
      message:
        overrides?.message || UPLOAD_ERRORS.INVALID_CONFIGURATION.message,
      info: overrides?.info,
    });
    this.name = "InvalidConfigurationError";
  }
}

/**
 * Missing field name error
 */
export class MissingFieldNameError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.MISSING_FIELD_NAME.type,
      code: overrides?.code || UPLOAD_ERRORS.MISSING_FIELD_NAME.code,
      status: overrides?.status || UPLOAD_ERRORS.MISSING_FIELD_NAME.status,
      message: overrides?.message || UPLOAD_ERRORS.MISSING_FIELD_NAME.message,
      info: overrides?.info,
    });
    this.name = "MissingFieldNameError";
  }
}

/**
 * Invalid URL error
 */
export class InvalidUrlError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.INVALID_URL.type,
      code: overrides?.code || UPLOAD_ERRORS.INVALID_URL.code,
      status: overrides?.status || UPLOAD_ERRORS.INVALID_URL.status,
      message: overrides?.message || UPLOAD_ERRORS.INVALID_URL.message,
      info: overrides?.info,
    });
    this.name = "InvalidUrlError";
  }
}

/**
 * Domain not allowed error
 */
export class DomainNotAllowedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.DOMAIN_NOT_ALLOWED.type,
      code: overrides?.code || UPLOAD_ERRORS.DOMAIN_NOT_ALLOWED.code,
      status: overrides?.status || UPLOAD_ERRORS.DOMAIN_NOT_ALLOWED.status,
      message: overrides?.message || UPLOAD_ERRORS.DOMAIN_NOT_ALLOWED.message,
      info: overrides?.info,
    });
    this.name = "DomainNotAllowedError";
  }
}

/**
 * Domain not allowed error
 */
export class DomainBlockedError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.DOMAIN_BLOCKED.type,
      code: overrides?.code || UPLOAD_ERRORS.DOMAIN_BLOCKED.code,
      status: overrides?.status || UPLOAD_ERRORS.DOMAIN_BLOCKED.status,
      message: overrides?.message || UPLOAD_ERRORS.DOMAIN_BLOCKED.message,
      info: overrides?.info,
    });
    this.name = "DomainBlockedError";
  }
}

/**
 * Suspicious file name error
 */
export class SuspiciousFileNameError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.SUSPICIOUS_FILE_NAME.type,
      code: overrides?.code || UPLOAD_ERRORS.SUSPICIOUS_FILE_NAME.code,
      status: overrides?.status || UPLOAD_ERRORS.SUSPICIOUS_FILE_NAME.status,
      message: overrides?.message || UPLOAD_ERRORS.SUSPICIOUS_FILE_NAME.message,
      info: overrides?.info,
    });
    this.name = "SuspiciousFileNameError";
  }
}

/**
 * Upload timeout error
 */
export class UploadTimeoutError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.UPLOAD_TIMEOUT.type,
      code: overrides?.code || UPLOAD_ERRORS.UPLOAD_TIMEOUT.code,
      status: overrides?.status || UPLOAD_ERRORS.UPLOAD_TIMEOUT.status,
      message: overrides?.message || UPLOAD_ERRORS.UPLOAD_TIMEOUT.message,
      info: overrides?.info,
    });
    this.name = "UploadTimeoutError";
  }
}

/**
 * Network error
 */
export class NetworkError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.NETWORK_ERROR.type,
      code: overrides?.code || UPLOAD_ERRORS.NETWORK_ERROR.code,
      status: overrides?.status || UPLOAD_ERRORS.NETWORK_ERROR.status,
      message: overrides?.message || UPLOAD_ERRORS.NETWORK_ERROR.message,
      info: overrides?.info,
    });
    this.name = "NetworkError";
  }
}

/**
 * Too many redirects error
 */
export class TooManyRedirectsError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.TOO_MANY_REDIRECTS.type,
      code: overrides?.code || UPLOAD_ERRORS.TOO_MANY_REDIRECTS.code,
      status: overrides?.status || UPLOAD_ERRORS.TOO_MANY_REDIRECTS.status,
      message: overrides?.message || UPLOAD_ERRORS.TOO_MANY_REDIRECTS.message,
      info: overrides?.info,
    });
    this.name = "TooManyRedirectsError";
  }
}

/**
 * HTTP error
 */
export class HttpError extends UploadError {
  constructor(overrides?: Partial<UploadErrorInfo>) {
    super({
      type: overrides?.type || UPLOAD_ERRORS.HTTP_ERROR.type,
      code: overrides?.code || UPLOAD_ERRORS.HTTP_ERROR.code,
      status: overrides?.status || UPLOAD_ERRORS.HTTP_ERROR.status,
      message: overrides?.message || UPLOAD_ERRORS.HTTP_ERROR.message,
      info: overrides?.info,
    });
    this.name = "HttpError";
  }
}
