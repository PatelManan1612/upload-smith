// providers/aws-s3-provider.ts
// AWS S3 cloud storage provider implementation

import fs from "fs";
import path from "path";
import { AwsS3Config, CloudUploadResult, ICloudStorageProvider } from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

/**
 * AWS S3 Storage Provider
 *
 * Installation: npm install @aws-sdk/client-s3
 */
export class AwsS3Provider implements ICloudStorageProvider {
  private s3Client: any;
  private config: AwsS3Config;

  constructor(config: AwsS3Config) {
    this.config = config;
    this.validateConfig();
    this.initializeClient();
  }

  /**
   * Validate AWS S3 configuration
   */
  private validateConfig(): void {
    if (!this.config.accessKeyId) {
      throw new CloudStorageConfigError({
        message: "AWS accessKeyId is required",
        info: { provider: "aws" },
      });
    }

    if (!this.config.secretAccessKey) {
      throw new CloudStorageConfigError({
        message: "AWS secretAccessKey is required",
        info: { provider: "aws" },
      });
    }

    if (!this.config.region) {
      throw new CloudStorageConfigError({
        message: "AWS region is required",
        info: { provider: "aws" },
      });
    }

    if (!this.config.bucket) {
      throw new CloudStorageConfigError({
        message: "AWS bucket name is required",
        info: { provider: "aws" },
      });
    }
  }

  /**
   * Initialize AWS S3 client
   */
  private async initializeClient(): Promise<void> {
    try {
      // Dynamic import to avoid requiring the package if not used
      const { S3Client } = await import("@aws-sdk/client-s3");

      const clientConfig: any = {
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      };

      // Add custom endpoint if provided (for S3-compatible services)
      if (this.config.endpoint) {
        clientConfig.endpoint = this.config.endpoint;
        clientConfig.forcePathStyle = this.config.forcePathStyle ?? true;
      }

      this.s3Client = new S3Client(clientConfig);
    } catch (error: any) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message?.includes("Cannot find module")
      ) {
        throw new CloudSdkNotInstalledError({
          message:
            "AWS SDK is not installed. Run: npm install @aws-sdk/client-s3",
          info: {
            provider: "aws",
            package: "@aws-sdk/client-s3",
            installCommand: "npm install @aws-sdk/client-s3",
          },
        });
      }
      throw new CloudStorageConnectionError({
        message: `Failed to initialize AWS S3 client: ${error.message}`,
        info: { provider: "aws", error: error.message },
      });
    }
  }

  /**
   * Upload file to AWS S3
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string,
  ): Promise<CloudUploadResult> {
    try {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");

      // Read file
      const fileContent = fs.readFileSync(filePath);
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // Normalize path (remove leading slash)
      const key = destinationPath.startsWith("/")
        ? destinationPath.slice(1)
        : destinationPath;

      // Upload parameters
      const uploadParams = {
        Bucket: this.config.bucket,
        Key: key,
        Body: fileContent,
        ContentType: mimetype,
        ACL: this.config.acl || "private",
      };

      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Generate URLs
      const cloudUrl = this.getPublicUrl(key);
      const cdnUrl = this.getCdnUrl(key);

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "aws",
        cloudPath: key,
        cloudUrl,
        publicUrl: cloudUrl,
        cdnUrl: this.config.cdnDomain ? cdnUrl : undefined,
        metadata: {
          bucket: this.config.bucket,
          region: this.config.region,
          acl: this.config.acl || "private",
        },
      };
    } catch (error: any) {
      // Handle specific AWS errors
      if (error.name === "AccessDenied" || error.Code === "AccessDenied") {
        throw new CloudStoragePermissionError({
          message: "Access denied to AWS S3 bucket",
          info: {
            provider: "aws",
            bucket: this.config.bucket,
            error: error.message,
          },
        });
      }

      if (error.name === "NoSuchBucket" || error.Code === "NoSuchBucket") {
        throw new CloudStorageConfigError({
          message: `AWS S3 bucket '${this.config.bucket}' does not exist`,
          info: {
            provider: "aws",
            bucket: this.config.bucket,
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to AWS S3: ${error.message}`,
        info: {
          provider: "aws",
          bucket: this.config.bucket,
          error: error.message,
          errorCode: error.Code || error.name,
        },
      });
    }
  }

  /**
   * Delete file from AWS S3
   */
  async delete(cloudPath: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      const key = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from AWS S3: ${error.message}`,
        info: {
          provider: "aws",
          cloudPath,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get public URL for S3 object
   */
  getPublicUrl(cloudPath: string): string {
    const key = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;

    if (this.config.endpoint) {
      // Custom endpoint (e.g., MinIO, DigitalOcean Spaces)
      const endpoint = this.config.endpoint.replace(/\/$/, "");
      return `${endpoint}/${this.config.bucket}/${key}`;
    }

    // Standard S3 URL
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Get CDN URL (CloudFront) if configured
   */
  getCdnUrl(cloudPath: string): string {
    const key = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;

    if (this.config.cdnDomain) {
      const domain = this.config.cdnDomain.replace(/\/$/, "");
      return `https://${domain}/${key}`;
    }

    // Fall back to regular URL
    return this.getPublicUrl(cloudPath);
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.region &&
      this.config.bucket
    );
  }
}
