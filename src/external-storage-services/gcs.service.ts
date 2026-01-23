// providers/gcs-provider.ts
// Google Cloud Storage provider implementation

import fs from "fs";
import path from "path";
import { GcsConfig, CloudUploadResult, ICloudStorageProvider } from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

/**
 * Google Cloud Storage Provider
 *
 * Installation: npm install @google-cloud/storage
 */
export class GcsProvider implements ICloudStorageProvider {
  private storage: any;
  private bucket: any;
  private config: GcsConfig;

  constructor(config: GcsConfig) {
    this.config = config;
    this.validateConfig();
    this.initializeClient();
  }

  /**
   * Validate GCS configuration
   */
  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new CloudStorageConfigError({
        message: "GCS projectId is required",
        info: { provider: "gcs" },
      });
    }

    if (!this.config.bucket) {
      throw new CloudStorageConfigError({
        message: "GCS bucket name is required",
        info: { provider: "gcs" },
      });
    }

    if (!this.config.keyFilename && !this.config.credentials) {
      throw new CloudStorageConfigError({
        message: "GCS keyFilename or credentials are required",
        info: { provider: "gcs" },
      });
    }
  }

  /**
   * Initialize Google Cloud Storage client
   */
  private async initializeClient(): Promise<void> {
    try {
      const { Storage } = await import("@google-cloud/storage");

      const clientConfig: any = {
        projectId: this.config.projectId,
      };

      if (this.config.keyFilename) {
        clientConfig.keyFilename = this.config.keyFilename;
      } else if (this.config.credentials) {
        clientConfig.credentials = this.config.credentials;
      }

      this.storage = new Storage(clientConfig);
      this.bucket = this.storage.bucket(this.config.bucket);
    } catch (error: any) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message?.includes("Cannot find module")
      ) {
        throw new CloudSdkNotInstalledError({
          message:
            "Google Cloud Storage SDK is not installed. Run: npm install @google-cloud/storage",
          info: {
            provider: "gcs",
            package: "@google-cloud/storage",
            installCommand: "npm install @google-cloud/storage",
          },
        });
      }
      throw new CloudStorageConnectionError({
        message: `Failed to initialize GCS client: ${error.message}`,
        info: { provider: "gcs", error: error.message },
      });
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string,
  ): Promise<CloudUploadResult> {
    try {
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // Normalize path
      const destination = destinationPath.startsWith("/")
        ? destinationPath.slice(1)
        : destinationPath;

      // Upload options
      const uploadOptions: any = {
        destination,
        metadata: {
          contentType: mimetype,
        },
      };

      // Set predefined ACL if specified
      if (this.config.predefinedAcl) {
        uploadOptions.predefinedAcl = this.config.predefinedAcl;
      }

      // Upload file
      await this.bucket.upload(filePath, uploadOptions);

      // Generate URLs
      const cloudUrl = this.getPublicUrl(destination);
      const cdnUrl = this.getCdnUrl(destination);

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "gcs",
        cloudPath: destination,
        cloudUrl,
        publicUrl: cloudUrl,
        cdnUrl: this.config.cdnDomain ? cdnUrl : undefined,
        metadata: {
          bucket: this.config.bucket,
          projectId: this.config.projectId,
          acl: this.config.predefinedAcl || "private",
        },
      };
    } catch (error: any) {
      // Handle specific GCS errors
      if (error.code === 403 || error.message?.includes("forbidden")) {
        throw new CloudStoragePermissionError({
          message: "Access denied to GCS bucket",
          info: {
            provider: "gcs",
            bucket: this.config.bucket,
            error: error.message,
          },
        });
      }

      if (error.code === 404 || error.message?.includes("not found")) {
        throw new CloudStorageConfigError({
          message: `GCS bucket '${this.config.bucket}' does not exist`,
          info: {
            provider: "gcs",
            bucket: this.config.bucket,
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to GCS: ${error.message}`,
        info: {
          provider: "gcs",
          bucket: this.config.bucket,
          error: error.message,
          errorCode: error.code,
        },
      });
    }
  }

  /**
   * Delete file from Google Cloud Storage
   */
  async delete(cloudPath: string): Promise<void> {
    try {
      const path = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
      const file = this.bucket.file(path);
      await file.delete();
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from GCS: ${error.message}`,
        info: {
          provider: "gcs",
          cloudPath,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get public URL for GCS object
   */
  getPublicUrl(cloudPath: string): string {
    const path = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
    return `https://storage.googleapis.com/${this.config.bucket}/${path}`;
  }

  /**
   * Get CDN URL if Cloud CDN is configured
   */
  getCdnUrl(cloudPath: string): string {
    const path = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;

    if (this.config.cdnDomain) {
      const domain = this.config.cdnDomain.replace(/\/$/, "");
      return `https://${domain}/${path}`;
    }

    return this.getPublicUrl(cloudPath);
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.projectId &&
      this.config.bucket &&
      (this.config.keyFilename || this.config.credentials)
    );
  }
}
