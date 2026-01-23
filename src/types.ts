import { Request } from "express";

export interface FolderConfig {
  /** Base upload directory path (default: "uploads") */
  basePath?: string;

  /** Automatically create directories if they don't exist (default: true) */
  autoCreate?: boolean;

  /** Organize files by extension in separate folders */
  byExtension?: boolean;

  /** Organize files by category using extensionMap */
  byCategory?: boolean;

  /** Map extensions to category folders (e.g., { jpg: "images", pdf: "documents" }) */
  extensionMap?: Record<string, string>;
}

export interface SizeConfig {
  /** Enable per-extension size limits (default: false) */
  enabled?: boolean;

  /** Default file size limit in MB (default: 5) */
  defaultMB?: number;

  /** Per-extension size limits in MB (e.g., { jpg: 10, pdf: 20 }) */
  perExtensionMB?: Record<string, number>;
}

export interface UrlUploadConfig {
  /** Enable URL upload support (default: false) */
  enabled: boolean;

  /** Maximum file size for URL downloads in MB (default: 50) */
  maxSizeMB?: number;

  /** Request timeout in milliseconds (default: 30000 - 30 seconds) */
  timeout?: number;

  /** Allowed domains for URL uploads (whitelist). If empty, all domains allowed. */
  allowedDomains?: string[];

  /** Blocked domains for URL uploads (blacklist). If empty, all domains allowed. */
  blockedDomains?: string[];

  /** Follow HTTP redirects (default: true) */
  followRedirects?: boolean;

  /** Maximum number of redirects to follow (default: 5) */
  maxRedirects?: number;

  /** Custom headers for URL requests */
  headers?: Record<string, string>;

  /** User agent string (default: 'upload-smith') */
  userAgent?: string;
}

export interface UploadConfig {
  /** Field name in the form data */
  fieldName: string;

  /** Array of allowed file extensions (e.g., ["jpg", "png", "pdf"]) */
  allowedExtensions?: string[];

  /** File size configuration */
  sizeConfig?: SizeConfig;

  /** Custom filename function */
  filename?: (req: Request, file: Express.Multer.File) => string;

  /** Allow multiple file uploads (default: false) */
  multiple?: boolean;

  /** Maximum number of files when multiple is true (default: 5) */
  maxFiles?: number;

  /** Folder organization configuration */
  folderConfig?: FolderConfig;

  /** Automatically cleanup uploaded files on errors (default: true)
   * This includes multer errors, validation errors, and controller errors
   */
  cleanupOnError?: boolean;

  /** Allow partial uploads when using multiple files (default: false)
   * When true: saves valid files and returns rejected files info
   * When false: rejects all files if any file is invalid
   */
  partialUpload?: boolean;

  /** Compress images after upload (only applies to image files) (default: false) */
  compressImage?: boolean;

  /** Image compression quality (1-100) (default: 80) */
  imageQuality?: number;

  /** URL upload configuration (enables downloading from URLs) */
  urlUpload?: UrlUploadConfig;
}

// TypeScript declaration extension for upload-smith
// Add this to your project if using TypeScript

declare global {
  namespace Express {
    interface Request {
      rejectedFiles?: Array<{
        originalname: string;
        reason: string;
        mimetype?: string;
        size?: number;
      }>;
    }
  }
}
