// cloud-storage.ts
// Main cloud storage service that manages all providers

import fs from "fs";
import path from "path";
import {
  CloudStorageConfig,
  CloudUploadResult,
  ICloudStorageProvider,
  CloudStorageProvider as ProviderType,
} from "./types.js";

import { CloudStorageConfigError, CloudStorageUploadError } from "./error.js";
import { AwsS3Provider } from "./external-storage-services/aws.service.js";
import { GcsProvider } from "./external-storage-services/gcs.service.js";
import { AzureBlobProvider } from "./external-storage-services/azure.service.js";
import { CloudinaryProvider } from "./external-storage-services/cloudinary.service.js";
import { SftpProvider } from "./external-storage-services/sftp.service.js";
import { FtpProvider } from "./external-storage-services/ftp.service.js";

/**
 * Cloud Storage Service
 * Manages file uploads to various cloud storage providers
 */
export class CloudStorageService {
  private provider: ICloudStorageProvider;
  private config: CloudStorageConfig;
  private uploadedFiles: Map<string, CloudUploadResult> = new Map();

  constructor(config: CloudStorageConfig) {
    this.config = config;
    this.validateConfig();
    this.provider = this.createProvider();
  }

  /**
   * Validate cloud storage configuration
   */
  private validateConfig(): void {
    if (!this.config.enabled) {
      throw new CloudStorageConfigError({
        message: "Cloud storage is not enabled",
      });
    }

    if (!this.config.provider) {
      throw new CloudStorageConfigError({
        message: "Cloud storage provider is required",
      });
    }

    const validProviders: ProviderType[] = [
      "aws",
      "gcs",
      "azure",
      "cloudinary",
      "sftp", // ✅ NEW
      "ftp", // ✅ NEW
    ];
    if (!validProviders.includes(this.config.provider)) {
      throw new CloudStorageConfigError({
        message: `Invalid cloud storage provider: ${this.config.provider}`,
        info: {
          provider: this.config.provider,
          validProviders,
        },
      });
    }

    // Validate provider-specific config
    switch (this.config.provider) {
      case "aws":
        if (!this.config.aws) {
          throw new CloudStorageConfigError({
            message: "AWS configuration is required when provider is 'aws'",
          });
        }
        break;

      case "gcs":
        if (!this.config.gcs) {
          throw new CloudStorageConfigError({
            message: "GCS configuration is required when provider is 'gcs'",
          });
        }
        break;

      case "azure":
        if (!this.config.azure) {
          throw new CloudStorageConfigError({
            message: "Azure configuration is required when provider is 'azure'",
          });
        }
        break;

      case "cloudinary":
        if (!this.config.cloudinary) {
          throw new CloudStorageConfigError({
            message:
              "Cloudinary configuration is required when provider is 'cloudinary'",
          });
        }
        break;

      // ✅ NEW: SFTP validation
      case "sftp":
        if (!this.config.sftp) {
          throw new CloudStorageConfigError({
            message: "SFTP configuration is required when provider is 'sftp'",
          });
        }
        break;

      // ✅ NEW: FTP validation
      case "ftp":
        if (!this.config.ftp) {
          throw new CloudStorageConfigError({
            message: "FTP configuration is required when provider is 'ftp'",
          });
        }
        break;
    }
  }

  /**
   * Create appropriate provider instance
   */
  private createProvider(): ICloudStorageProvider {
    switch (this.config.provider) {
      case "aws":
        return new AwsS3Provider(this.config.aws!);

      case "gcs":
        return new GcsProvider(this.config.gcs!);

      case "azure":
        return new AzureBlobProvider(this.config.azure!);

      case "cloudinary":
        return new CloudinaryProvider(this.config.cloudinary!);

      // ✅ NEW: SFTP provider
      case "sftp":
        return new SftpProvider(this.config.sftp!);

      // ✅ NEW: FTP provider
      case "ftp":
        return new FtpProvider(this.config.ftp!);
      default:
        throw new CloudStorageConfigError({
          message: `Unsupported provider: ${this.config.provider}`,
        });
    }
  }

  /**
   * Upload file to cloud storage with automatic cleanup tracking
   */
  async uploadFile(
    file: Express.Multer.File,
    destinationPath?: string,
  ): Promise<CloudUploadResult> {
    try {
      // Validate file exists
      if (!fs.existsSync(file.path)) {
        throw new CloudStorageUploadError({
          message: `File not found: ${file.path}`,
          info: { filePath: file.path },
        });
      }

      // Determine destination path
      let cloudPath: string;
      if (this.config.uploadPath) {
        cloudPath = path.join(this.config.uploadPath, file.filename);
      } else if (destinationPath) {
        cloudPath = destinationPath;
      } else {
        const relativePath = file.path.split(path.sep).slice(1).join("/");
        cloudPath = relativePath || file.filename;
      }

      cloudPath = cloudPath.replace(/\\/g, "/");

      // Upload to cloud
      const result = await this.provider.upload(
        file.path,
        cloudPath,
        file.mimetype,
      );

      // ✅ TRACK UPLOADED FILE FOR CLEANUP
      this.uploadedFiles.set(file.filename, result);

      // Add metadata if configured
      if (this.config.metadata) {
        result.metadata = {
          ...result.metadata,
          ...this.config.metadata,
        };
      }

      // Delete local file if configured
      if (!this.config.keepLocalCopy) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.warn(`Failed to delete local file: ${file.path}`, error);
        }
      } else {
        result.localPath = file.path;
      }

      // Add CDN URL if configured
      if (this.config.useCdn) {
        result.cdnUrl = this.provider.getCdnUrl(cloudPath);
      }

      return result;
    } catch (error: any) {
      // Re-throw cloud storage errors
      if (error.name?.includes("CloudStorage")) {
        throw error;
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload file to cloud: ${error.message}`,
        info: {
          provider: this.config.provider,
          filename: file.filename,
          error: error.message,
        },
      });
    }
  }

  /**
   * Upload multiple files with tracking
   */
  async uploadFiles(
    files: Express.Multer.File[],
  ): Promise<CloudUploadResult[]> {
    const results: CloudUploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file.filename}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * ✅ NEW: Cleanup all uploaded files (for error handling)
   */
  async cleanupAllUploads(): Promise<void> {
    const errors: any[] = [];

    for (const [filename, result] of this.uploadedFiles.entries()) {
      try {
        await this.provider.delete(result.cloudPath);
        console.log(`✅ Cleaned up cloud file: ${filename}`);
      } catch (error: any) {
        console.error(`❌ Failed to cleanup ${filename}:`, error.message);
        errors.push({ filename, error: error.message });
      }
    }

    // Clear tracking
    this.uploadedFiles.clear();

    if (errors.length > 0) {
      throw new CloudStorageUploadError({
        message: `Failed to cleanup ${errors.length} files`,
        info: { errors },
      });
    }
  }

  /**
   * ✅ NEW: Cleanup specific file
   */
  async cleanupUpload(filename: string): Promise<void> {
    const result = this.uploadedFiles.get(filename);

    if (!result) {
      console.warn(`File ${filename} not tracked for cleanup`);
      return;
    }

    try {
      await this.provider.delete(result.cloudPath);
      this.uploadedFiles.delete(filename);
      console.log(`✅ Cleaned up: ${filename}`);
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to cleanup ${filename}: ${error.message}`,
        info: { filename, cloudPath: result.cloudPath },
      });
    }
  }

  /**
   * ✅ NEW: Clear tracking without deletion
   */
  clearTracking(): void {
    this.uploadedFiles.clear();
  }

  /**
   * Delete file from cloud storage (existing method)
   */
  async deleteFile(cloudPath: string): Promise<void> {
    await this.provider.delete(cloudPath);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(cloudPath: string): string {
    return this.provider.getPublicUrl(cloudPath);
  }

  /**
   * Get CDN URL for a file
   */
  getCdnUrl(cloudPath: string): string {
    return this.provider.getCdnUrl(cloudPath);
  }

  /**
   * Check if cloud storage is configured
   */
  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Get current provider name
   */
  getProvider(): ProviderType {
    return this.config.provider;
  }

  /**
   * ✅ NEW: Get tracked uploads count
   */
  getTrackedUploadsCount(): number {
    return this.uploadedFiles.size;
  }
}

/**
 * Factory function to create cloud storage service
 */
export function createCloudStorageService(
  config: CloudStorageConfig,
): CloudStorageService {
  return new CloudStorageService(config);
}

/**
 * Helper function to upload a single file to cloud storage
 */
export async function uploadToCloud(
  file: Express.Multer.File,
  config: CloudStorageConfig,
): Promise<CloudUploadResult> {
  const service = new CloudStorageService(config);
  return service.uploadFile(file);
}
