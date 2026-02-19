// providers/ftp-provider.ts
// FTP cloud storage provider implementation

import fs from "fs";
import path from "path";
import { FtpConfig, CloudUploadResult, ICloudStorageProvider } from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

/**
 * FTP Storage Provider
 *
 * Installation: npm install basic-ftp
 */
export class FtpProvider implements ICloudStorageProvider {
  private ftpClient: any;
  private config: FtpConfig;

  constructor(config: FtpConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate FTP configuration
   */
  private validateConfig(): void {
    if (!this.config.host) {
      throw new CloudStorageConfigError({
        message: "FTP host is required",
        info: { provider: "ftp" },
      });
    }

    if (!this.config.username) {
      throw new CloudStorageConfigError({
        message: "FTP username is required",
        info: { provider: "ftp" },
      });
    }

    if (!this.config.password) {
      throw new CloudStorageConfigError({
        message: "FTP password is required",
        info: { provider: "ftp" },
      });
    }

    if (!this.config.remotePath) {
      throw new CloudStorageConfigError({
        message: "FTP remotePath is required",
        info: { provider: "ftp" },
      });
    }
  }

  /**
   * Initialize FTP client and connect
   */
  private async initializeClient(): Promise<any> {
    try {
      // Dynamic import to avoid requiring the package if not used
      const { Client } = await import("basic-ftp");

      const client = new Client();
      client.ftp.verbose = this.config.verbose || false;

      // Set timeout
      // client.ftp.timeout = this.config.timeout || 30000;

      // Connect to FTP server
      await client.access({
        host: this.config.host,
        port: this.config.port || 21,
        user: this.config.username,
        password: this.config.password,
        secure: this.config.secure || false, // Use FTPS if true
        secureOptions: this.config.secureOptions,
      });

      return client;
    } catch (error: any) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message?.includes("Cannot find module")
      ) {
        throw new CloudSdkNotInstalledError({
          message: "basic-ftp is not installed. Run: npm install basic-ftp",
          info: {
            provider: "ftp",
            package: "basic-ftp",
            installCommand: "npm install basic-ftp",
          },
        });
      }

      if (error.message?.includes("authentication") || error.code === 530) {
        throw new CloudStoragePermissionError({
          message: "FTP authentication failed",
          info: {
            provider: "ftp",
            host: this.config.host,
            username: this.config.username,
          },
        });
      }

      throw new CloudStorageConnectionError({
        message: `Failed to connect to FTP server: ${error.message}`,
        info: {
          provider: "ftp",
          host: this.config.host,
          error: error.message,
        },
      });
    }
  }

  /**
   * Ensure remote directory exists
   */
  private async ensureRemoteDirectory(
    client: any,
    remotePath: string
  ): Promise<void> {
    try {
      await client.ensureDir(remotePath);
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to create remote directory: ${error.message}`,
        info: {
          provider: "ftp",
          remotePath,
          error: error.message,
        },
      });
    }
  }

  /**
   * Upload file to FTP server
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string
  ): Promise<CloudUploadResult> {
    let client: any;

    try {
      client = await this.initializeClient();

      // Read file
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // Construct remote path
      const remotePath = this.config.remotePath.endsWith("/")
        ? this.config.remotePath
        : this.config.remotePath + "/";
      const fullRemotePath = remotePath + destinationPath;

      // Ensure remote directory exists
      const remoteDir = path.dirname(fullRemotePath);
      await this.ensureRemoteDirectory(client, remoteDir);

      // Upload file
      const readable = fs.createReadStream(filePath);
      await client.uploadFrom(readable, fullRemotePath);

      // Generate URLs
      const cloudUrl = this.getPublicUrl(destinationPath);

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "ftp",
        cloudPath: fullRemotePath,
        cloudUrl,
        publicUrl: cloudUrl,
        metadata: {
          host: this.config.host,
          port: this.config.port || 21,
          remotePath: fullRemotePath,
          secure: this.config.secure || false,
        },
      };
    } catch (error: any) {
      if (error.code === 550 || error.message?.includes("Permission denied")) {
        throw new CloudStoragePermissionError({
          message: "Permission denied to write to FTP server",
          info: {
            provider: "ftp",
            host: this.config.host,
            remotePath: destinationPath,
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to FTP: ${error.message}`,
        info: {
          provider: "ftp",
          host: this.config.host,
          error: error.message,
        },
      });
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  /**
   * Delete file from FTP server
   */
  async delete(cloudPath: string): Promise<void> {
    let client: any;

    try {
      client = await this.initializeClient();
      await client.remove(cloudPath);
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from FTP: ${error.message}`,
        info: {
          provider: "ftp",
          cloudPath,
          error: error.message,
        },
      });
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  /**
   * Get public URL for FTP file
   */
  getPublicUrl(cloudPath: string): string {
    // If baseUrl is configured, use it (e.g., HTTP access to FTP files)
    if (this.config.baseUrl) {
      const baseUrl = this.config.baseUrl.replace(/\/$/, "");
      const path = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
      return `${baseUrl}/${path}`;
    }

    // Otherwise, construct FTP URL (not publicly accessible via browser)
    const protocol = this.config.secure ? "ftps" : "ftp";
    return `${protocol}://${this.config.host}:${this.config.port || 21}${
      this.config.remotePath
    }/${cloudPath}`;
  }

  /**
   * Get CDN URL (same as public URL for FTP)
   */
  getCdnUrl(cloudPath: string): string {
    return this.getPublicUrl(cloudPath);
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.host &&
      this.config.username &&
      this.config.password &&
      this.config.remotePath
    );
  }
}