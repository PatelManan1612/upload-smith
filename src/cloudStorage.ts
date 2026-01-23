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

/**
 * Cloud Storage Service
 * Manages file uploads to various cloud storage providers
 */
export class CloudStorageService {
  private provider: ICloudStorageProvider;
  private config: CloudStorageConfig;

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

      default:
        throw new CloudStorageConfigError({
          message: `Unsupported provider: ${this.config.provider}`,
        });
    }
  }

  /**
   * Upload file to cloud storage
   * @param file - Multer file object
   * @param destinationPath - Optional custom path (uses file.path if not provided)
   * @returns Cloud upload result
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
        // Use custom upload path from config
        cloudPath = path.join(this.config.uploadPath, file.filename);
      } else if (destinationPath) {
        // Use provided destination path
        cloudPath = destinationPath;
      } else {
        // Use the file's relative path (preserving folder structure)
        // Remove leading "uploads/" or similar base path
        const relativePath = file.path.split(path.sep).slice(1).join("/");
        cloudPath = relativePath || file.filename;
      }

      // Normalize path separators for cloud storage (use forward slashes)
      cloudPath = cloudPath.replace(/\\/g, "/");

      // Upload to cloud
      const result = await this.provider.upload(
        file.path,
        cloudPath,
        file.mimetype,
      );

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
        // Include local path in result
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

      // Wrap other errors
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
   * Upload multiple files to cloud storage
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
        // Continue with other files on error
        console.error(`Failed to upload ${file.filename}:`, error);
        throw error; // Or handle differently based on your needs
      }
    }

    return results;
  }

  /**
   * Delete file from cloud storage
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
