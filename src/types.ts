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

  /** Compress images after upload (only applies to image files) (default: false) */
  compressImage?: boolean;
  
  /** Image compression quality (1-100) (default: 80) */
  imageQuality?: number;
}