// providers/cloudinary-provider.ts
// FIXED VERSION - Cloudinary provider implementation

import fs from "fs";
import path from "path";
import { CloudinaryConfig, CloudUploadResult, ICloudStorageProvider } from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

/**
 * Cloudinary Provider (Best for images and videos)
 * 
 * Installation: npm install cloudinary
 */
export class CloudinaryProvider implements ICloudStorageProvider {
  private cloudinary: any;
  private config: CloudinaryConfig;
  private initialized: boolean = false;

  constructor(config: CloudinaryConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate Cloudinary configuration
   */
  private validateConfig(): void {
    if (!this.config.cloud_name) {
      throw new CloudStorageConfigError({
        message: "Cloudinary cloud_name is required",
        info: { provider: "cloudinary" },
      });
    }

    if (!this.config.api_key) {
      throw new CloudStorageConfigError({
        message: "Cloudinary api_key is required",
        info: { provider: "cloudinary" },
      });
    }

    if (!this.config.api_secret) {
      throw new CloudStorageConfigError({
        message: "Cloudinary api_secret is required",
        info: { provider: "cloudinary" },
      });
    }
  }

  /**
   * Initialize Cloudinary client (lazy initialization)
   */
  private async initializeClient(): Promise<void> {
    if (this.initialized) {
      return; // Already initialized
    }

    try {
      // Dynamic import
      const cloudinaryModule = await import("cloudinary");
      
      // Get v2 API
      this.cloudinary = cloudinaryModule.v2;

      // Configure Cloudinary
      this.cloudinary.config({
        cloud_name: this.config.cloud_name,
        api_key: this.config.api_key,
        api_secret: this.config.api_secret,
        secure: this.config.secure !== false, // Default to true
      });

      this.initialized = true;
    } catch (error: any) {
      if (error.code === "ERR_MODULE_NOT_FOUND" || error.message?.includes("Cannot find module")) {
        throw new CloudSdkNotInstalledError({
          message: "Cloudinary SDK is not installed. Run: npm install cloudinary",
          info: {
            provider: "cloudinary",
            package: "cloudinary",
            installCommand: "npm install cloudinary",
          },
        });
      }
      throw new CloudStorageConnectionError({
        message: `Failed to initialize Cloudinary client: ${error.message}`,
        info: { provider: "cloudinary", error: error.message },
      });
    }
  }

  /**
   * Upload file to Cloudinary
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string
  ): Promise<CloudUploadResult> {
    // Ensure client is initialized
    await this.initializeClient();

    try {
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // Determine resource type based on mimetype
      const resourceType = this.getResourceType(mimetype);

      // Prepare upload options
      const uploadOptions: any = {
        resource_type: resourceType,
        use_filename: false,
      };

      // Set folder if specified
      if (this.config.folder) {
        uploadOptions.folder = this.config.folder;
      }

      // Set public ID from destination path (without extension)
      const publicId = destinationPath
        .replace(/^\//, "")
        .replace(/\.[^/.]+$/, ""); // Remove extension

      uploadOptions.public_id = publicId;

      // Add tags if specified
      if (this.config.tags && this.config.tags.length > 0) {
        uploadOptions.tags = this.config.tags;
      }

      // Upload to Cloudinary
      const result = await this.cloudinary.uploader.upload(filePath, uploadOptions);

      // Generate URLs
      const cloudUrl = result.secure_url || result.url;
      const publicUrl = cloudUrl;

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "cloudinary",
        cloudPath: result.public_id,
        cloudUrl,
        publicUrl,
        metadata: {
          cloudinary_id: result.public_id,
          cloudinary_url: result.url,
          cloudinary_secure_url: result.secure_url,
          resource_type: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at,
        },
      };
    } catch (error: any) {
      // Handle specific Cloudinary errors
      if (error.http_code === 401 || error.message?.includes("Invalid API key")) {
        throw new CloudStoragePermissionError({
          message: "Invalid Cloudinary credentials",
          info: {
            provider: "cloudinary",
            error: error.message,
          },
        });
      }

      if (error.http_code === 404) {
        throw new CloudStorageConfigError({
          message: "Cloudinary resource not found",
          info: {
            provider: "cloudinary",
            error: error.message,
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to Cloudinary: ${error.message}`,
        info: {
          provider: "cloudinary",
          error: error.message,
          httpCode: error.http_code,
        },
      });
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async delete(cloudPath: string): Promise<void> {
    // Ensure client is initialized
    await this.initializeClient();

    try {
      const publicId = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
      await this.cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from Cloudinary: ${error.message}`,
        info: {
          provider: "cloudinary",
          cloudPath,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get public URL for Cloudinary resource
   */
  getPublicUrl(cloudPath: string): string {
    const publicId = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;

    // Determine resource type (default to image)
    const resourceType = this.config.resource_type || "image";

    // Build URL manually
    const secure = this.config.secure !== false ? "https" : "http";
    return `${secure}://res.cloudinary.com/${this.config.cloud_name}/${resourceType}/upload/${publicId}`;
  }

  /**
   * Get CDN URL (Cloudinary has built-in CDN)
   */
  getCdnUrl(cloudPath: string): string {
    // Cloudinary already uses CDN, so same as public URL
    return this.getPublicUrl(cloudPath);
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.cloud_name &&
      this.config.api_key &&
      this.config.api_secret
    );
  }

  /**
   * Determine Cloudinary resource type from MIME type
   */
  private getResourceType(mimetype: string): "image" | "video" | "raw" | "auto" {
    if (this.config.resource_type && this.config.resource_type !== "auto") {
      return this.config.resource_type;
    }

    if (mimetype.startsWith("image/")) {
      return "image";
    }

    if (mimetype.startsWith("video/")) {
      return "video";
    }

    // For non-media files (PDFs, docs, etc.), use 'raw'
    return "raw";
  }
}