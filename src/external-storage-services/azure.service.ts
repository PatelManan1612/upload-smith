// providers/azure-blob-provider.ts
// Azure Blob Storage provider implementation

import fs from "fs";
import path from "path";
import {
  AzureConfig,
  CloudUploadResult,
  ICloudStorageProvider,
} from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

function normalizeAzureBlobName(input: string): string {
  const normalized = input
    .replace(/\\/g, "/") // Windows → URL
    .replace(/^\/+/, "") // remove leading /
    .replace(/\/{2,}/g, "/") // collapse //
    .trim();

  if (!normalized) {
    throw new CloudStorageConfigError({
      message: "Invalid Azure blob name: resolved to empty path",
      info: { provider: "azure", input },
    });
  }

  return normalized;
}
/**
 * Azure Blob Storage Provider
 *
 * Installation: npm install @azure/storage-blob
 */
export class AzureBlobProvider implements ICloudStorageProvider {
  private blobServiceClient: any;
  private containerClient: any;
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.config = config;
    this.validateConfig();
    this.initializeClient();
  }

  /**
   * Validate Azure configuration
   */
  private validateConfig(): void {
    if (
      !this.config.connectionString &&
      (!this.config.accountName || !this.config.accountKey)
    ) {
      throw new CloudStorageConfigError({
        message:
          "Azure connectionString or (accountName + accountKey) are required",
        info: { provider: "azure" },
      });
    }

    if (!this.config.containerName) {
      throw new CloudStorageConfigError({
        message: "Azure containerName is required",
        info: { provider: "azure" },
      });
    }
  }

  /**
   * Initialize Azure Blob Storage client
   */
  private async initializeClient(): Promise<void> {
    try {
      const { BlobServiceClient, StorageSharedKeyCredential } =
        await import("@azure/storage-blob");

      if (this.config.connectionString) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          this.config.connectionString,
        );
      } else {
        const sharedKeyCredential = new StorageSharedKeyCredential(
          this.config.accountName!,
          this.config.accountKey!,
        );

        const endpoint =
          this.config.endpoint ??
          `https://${this.config.accountName}.blob.core.windows.net`;

        this.blobServiceClient = new BlobServiceClient(
          endpoint,
          sharedKeyCredential,
        );
      }

      this.containerClient = this.blobServiceClient.getContainerClient(
        this.config.containerName,
      );
    } catch (error: any) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message?.includes("Cannot find module")
      ) {
        throw new CloudSdkNotInstalledError({
          message:
            "Azure Storage SDK is not installed. Run: npm install @azure/storage-blob",
          info: {
            provider: "azure",
            package: "@azure/storage-blob",
            installCommand: "npm install @azure/storage-blob",
          },
        });
      }
      throw new CloudStorageConnectionError({
        message: `Failed to initialize Azure Blob client: ${error.message}`,
        info: { provider: "azure", error: error.message },
      });
    }
  }

  /**
   * Upload file to Azure Blob Storage
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string,
  ): Promise<CloudUploadResult> {
    try {
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // Normalize path (Azure doesn't use leading slash)
      // const blobName = destinationPath.startsWith("/")
      //   ? destinationPath.slice(1)
      //   : destinationPath;

      const blobName = normalizeAzureBlobName(destinationPath);

      // Get block blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload options
      const uploadOptions: any = {
        blobHTTPHeaders: {
          blobContentType: mimetype,
          ...this.config.blobHTTPHeaders,
        },
      };

      // Upload file
      await blockBlobClient.uploadFile(filePath, uploadOptions);

      // Set blob access tier if needed (for optimization)
      // await blockBlobClient.setAccessTier("Hot"); // or "Cool", "Archive"

      // Generate URLs
      const cloudUrl = this.getPublicUrl(blobName);
      const cdnUrl = this.getCdnUrl(blobName);

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "azure",
        cloudPath: blobName,
        cloudUrl,
        publicUrl: cloudUrl,
        cdnUrl: this.config.cdnDomain ? cdnUrl : undefined,
        metadata: {
          containerName: this.config.containerName,
          accountName: this.config.accountName,
          publicAccessLevel: this.config.publicAccessLevel || "none",
        },
      };
    } catch (error: any) {
      // Handle specific Azure errors
      if (error.statusCode === 403 || error.code === "AuthorizationFailure") {
        throw new CloudStoragePermissionError({
          message: "Access denied to Azure Blob Storage",
          info: {
            provider: "azure",
            container: this.config.containerName,
            error: error.message,
          },
        });
      }

      if (error.statusCode === 404 || error.code === "ContainerNotFound") {
        throw new CloudStorageConfigError({
          message: `Azure container '${this.config.containerName}' does not exist`,
          info: {
            provider: "azure",
            container: this.config.containerName,
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to Azure Blob Storage: ${error.message}`,
        info: {
          provider: "azure",
          container: this.config.containerName,
          error: error.message,
          errorCode: error.code,
          statusCode: error.statusCode,
        },
      });
    }
  }

  /**
   * Delete file from Azure Blob Storage
   */
  async delete(cloudPath: string): Promise<void> {
    try {
      const blobName = cloudPath.startsWith("/")
        ? cloudPath.slice(1)
        : cloudPath;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from Azure Blob Storage: ${error.message}`,
        info: {
          provider: "azure",
          cloudPath,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get public URL for Azure blob
   */
  getPublicUrl(cloudPath: string): string {
    // const blobName = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
    const blobName = normalizeAzureBlobName(cloudPath);
    const accountName = this.config.accountName;
    const containerName = this.config.containerName;

    // ✅ CUSTOM ENDPOINT (private endpoint / emulator)
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${containerName}/${blobName}`;
    }
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  }

  /**
   * Get CDN URL if Azure CDN is configured
   */
  getCdnUrl(cloudPath: string): string {
    // const blobName = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
    const blobName = normalizeAzureBlobName(cloudPath);

    if (this.config.cdnDomain) {
      const domain = this.config.cdnDomain.replace(/\/$/, "");
      return `https://${domain}/${blobName}`;
    }

    return this.getPublicUrl(cloudPath);
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    const hasAuth =
      this.config.connectionString ||
      (this.config.accountName && this.config.accountKey);

    return !!(hasAuth && this.config.containerName);
  }
}
