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

/**
 * Supported cloud storage providers
 */
export type CloudStorageProvider = "aws" | "gcs" | "azure" | "cloudinary";

/**
 * AWS S3 Configuration
 */
export interface AwsS3Config {
  /** AWS Access Key ID */
  accessKeyId: string;

  /** AWS Secret Access Key */
  secretAccessKey: string;

  /** AWS Region (e.g., 'us-east-1', 'eu-west-1') */
  region: string;

  /** S3 Bucket name */
  bucket: string;

  /** Access Control List - Default: 'private' */
  acl?:
    | "private"
    | "public-read"
    | "public-read-write"
    | "authenticated-read"
    | "aws-exec-read"
    | "bucket-owner-read"
    | "bucket-owner-full-control";

  /** Custom S3 endpoint (for S3-compatible services like MinIO, DigitalOcean Spaces) */
  endpoint?: string;

  /** Force path style (needed for some S3-compatible services) */
  forcePathStyle?: boolean;

  /** CloudFront CDN domain (e.g., 'd111111abcdef8.cloudfront.net') */
  cdnDomain?: string;
}

/**
 * Google Cloud Storage Configuration
 */
export interface GcsConfig {
  /** GCP Project ID */
  projectId: string;

  /** Path to service account JSON key file */
  keyFilename?: string;

  /** Or provide credentials object directly */
  credentials?: {
    client_email: string;
    private_key: string;
  };

  apiEndpoint?: string;

  /** GCS Bucket name */
  bucket: string;

  /** Predefined ACL - Default: 'private' */
  predefinedAcl?:
    | "authenticatedRead"
    | "bucketOwnerFullControl"
    | "bucketOwnerRead"
    | "private"
    | "projectPrivate"
    | "publicRead";

  /** Cloud CDN domain (if Cloud CDN is enabled) */
  cdnDomain?: string;
}

export type AzureAuthConfig =
  | {
      connectionString: string;
      accountName?: never;
      accountKey?: never;
    }
  | {
      connectionString?: never;
      accountName: string;
      accountKey: string;
    };

/**
 * Azure Blob Storage Configuration
 */
export type AzureConfig = AzureAuthConfig & {
  /** Azure Storage Account Name */
  // accountName: string;

  // /** Azure Storage Account Key */
  // accountKey: string;

  // /** Or use full connection string */
  // connectionString?: string;

  endpoint?: string;

  /** Container name (equivalent to bucket) */
  containerName: string;

  /** Blob HTTP Headers */
  blobHTTPHeaders?: {
    blobContentType?: string;
    blobContentEncoding?: string;
    blobContentLanguage?: string;
    blobContentDisposition?: string;
    blobCacheControl?: string;
  };

  /** Public access level - Default: 'none' */
  publicAccessLevel?: "blob" | "container" | "none";

  /** Azure CDN domain (if CDN is enabled) */
  cdnDomain?: string;
};

/**
 * Cloudinary Configuration
 */
export interface CloudinaryConfig {
  /** Cloudinary cloud name */
  cloud_name: string;

  /** Cloudinary API key */
  api_key: string;

  /** Cloudinary API secret */
  api_secret: string;

  /** Use secure URLs (HTTPS) - Default: true */
  secure?: boolean;

  /** Upload to specific folder in Cloudinary */
  folder?: string;

  /** Resource type - Default: 'auto' */
  resource_type?: "image" | "video" | "raw" | "auto";

  /** Upload preset (for unsigned uploads) */
  upload_preset?: string;

  /** Tags to add to uploaded files */
  tags?: string[];
}

/**
 * Main Cloud Storage Configuration
 */
export interface CloudStorageConfig {
  /** Enable cloud storage uploads */
  enabled: boolean;

  /** Cloud provider to use */
  provider: CloudStorageProvider;

  /** AWS S3 configuration (required if provider is 'aws') */
  aws?: AwsS3Config;

  /** Google Cloud Storage configuration (required if provider is 'gcs') */
  gcs?: GcsConfig;

  /** Azure Blob Storage configuration (required if provider is 'azure') */
  azure?: AzureConfig;

  /** Cloudinary configuration (required if provider is 'cloudinary') */
  cloudinary?: CloudinaryConfig;

  /** Keep local copy after cloud upload - Default: false */
  keepLocalCopy?: boolean;

  /** Generate and return public URL - Default: true */
  publicUrl?: boolean;

  /** Use CDN URL if available - Default: false */
  useCdn?: boolean;

  /** Custom metadata to attach to uploaded files */
  metadata?: Record<string, string>;

  /** Custom upload path (overrides folderConfig) */
  uploadPath?: string;

  /** Upload directly to cloud (skip local storage) - Default: false */
  directUpload?: boolean;
}

/**
 * Cloud upload result
 */
export interface CloudUploadResult {
  /** Original filename */
  filename: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimetype: string;

  /** Cloud provider used */
  provider: CloudStorageProvider;

  /** Path/key in cloud storage */
  cloudPath: string;

  /** Direct cloud URL */
  cloudUrl: string;

  /** Public URL (may be same as cloudUrl) */
  publicUrl?: string;

  /** CDN URL (if CDN is configured) */
  cdnUrl?: string;

  /** Local file path (if keepLocalCopy is true) */
  localPath?: string;

  /** Additional provider-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Extended Multer File with cloud storage info
 */
export interface CloudStorageFile extends Express.Multer.File {
  /** Cloud storage URL */
  cloudUrl?: string;

  /** Public URL */
  publicUrl?: string;

  /** CDN URL */
  cdnUrl?: string;

  /** Cloud provider */
  cloudProvider?: CloudStorageProvider;

  /** Path in cloud storage */
  cloudPath?: string;

  /** Cloud upload metadata */
  cloudMetadata?: Record<string, any>;
}

/**
 * Base interface for all cloud storage providers
 */
export interface ICloudStorageProvider {
  /**
   * Upload a file to cloud storage
   * @param filePath - Local file path
   * @param destinationPath - Path in cloud storage
   * @param mimetype - File MIME type
   * @returns Upload result with URLs
   */
  upload(
    filePath: string,
    destinationPath: string,
    mimetype: string,
  ): Promise<CloudUploadResult>;

  /**
   * Delete a file from cloud storage
   * @param cloudPath - Path in cloud storage
   */
  delete(cloudPath: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param cloudPath - Path in cloud storage
   * @returns Public URL
   */
  getPublicUrl(cloudPath: string): string;

  /**
   * Get CDN URL for a file (if CDN is configured)
   * @param cloudPath - Path in cloud storage
   * @returns CDN URL or regular URL if CDN not configured
   */
  getCdnUrl(cloudPath: string): string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
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

  /** To make the image field require */
  requireFile?: boolean;

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

  /** Cloud storage configuration */
  cloudStorage?: CloudStorageConfig;
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
