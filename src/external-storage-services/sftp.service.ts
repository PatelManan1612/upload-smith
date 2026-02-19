// providers/sftp-provider.ts - FIXED VERSION
// SFTP cloud storage provider implementation

import fs from "fs";
import path from "path";
import { SftpConfig, CloudUploadResult, ICloudStorageProvider } from "../types.js";
import {
  CloudStorageConfigError,
  CloudStorageUploadError,
  CloudStorageConnectionError,
  CloudSdkNotInstalledError,
  CloudStoragePermissionError,
} from "../error.js";

/**
 * SFTP Storage Provider
 *
 * Installation: npm install ssh2
 */
export class SftpProvider implements ICloudStorageProvider {
  private sftpClient: any;
  private config: SftpConfig;
  private isConnected: boolean = false;

  constructor(config: SftpConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate SFTP configuration
   */
  private validateConfig(): void {
    if (!this.config.host) {
      throw new CloudStorageConfigError({
        message: "SFTP host is required",
        info: { provider: "sftp" },
      });
    }

    if (!this.config.username) {
      throw new CloudStorageConfigError({
        message: "SFTP username is required",
        info: { provider: "sftp" },
      });
    }

    // Must have either password or privateKey
    if (!this.config.password && !this.config.privateKey) {
      throw new CloudStorageConfigError({
        message: "SFTP password or privateKey is required",
        info: { provider: "sftp" },
      });
    }

    if (!this.config.remotePath) {
      throw new CloudStorageConfigError({
        message: "SFTP remotePath is required",
        info: { provider: "sftp" },
      });
    }
  }

  /**
   * Initialize SFTP client and connect
   */
  private async initializeClient(): Promise<void> {
    if (this.isConnected && this.sftpClient) {
      return; // Already connected
    }

    try {
      // Dynamic import to avoid requiring the package if not used
      const { Client } = await import("ssh2");

      this.sftpClient = new Client();

      // Connect to SFTP server
      await new Promise<void>((resolve, reject) => {
        this.sftpClient.on("ready", () => {
          this.isConnected = true;
          resolve();
        });

        this.sftpClient.on("error", (err: Error) => {
          this.isConnected = false;
          reject(err);
        });

        // Connection config
        const connectionConfig: any = {
          host: this.config.host,
          port: this.config.port || 22,
          username: this.config.username,
          password: this.config.password,
          privateKey: this.config.privateKey
            ? fs.readFileSync(this.config.privateKey)
            : undefined,
          passphrase: this.config.passphrase,
          readyTimeout: this.config.timeout || 30000,
          keepaliveInterval: 10000,
        };

        this.sftpClient.connect(connectionConfig);
      });
    } catch (error: any) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message?.includes("Cannot find module")
      ) {
        throw new CloudSdkNotInstalledError({
          message: "ssh2 is not installed. Run: npm install ssh2",
          info: {
            provider: "sftp",
            package: "ssh2",
            installCommand: "npm install ssh2",
          },
        });
      }

      if (error.message?.includes("authentication")) {
        throw new CloudStoragePermissionError({
          message: "SFTP authentication failed",
          info: {
            provider: "sftp",
            host: this.config.host,
            username: this.config.username,
          },
        });
      }

      throw new CloudStorageConnectionError({
        message: `Failed to connect to SFTP server: ${error.message}`,
        info: {
          provider: "sftp",
          host: this.config.host,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get SFTP session
   */
  private async getSftpSession(): Promise<any> {
    await this.initializeClient();

    return new Promise((resolve, reject) => {
      this.sftpClient.sftp((err: Error, sftp: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(sftp);
        }
      });
    });
  }

  /**
   * Create remote directory recursively - FIXED VERSION
   */
  private async createRemoteDirectory(
    sftp: any,
    remotePath: string
  ): Promise<void> {
    // Normalize path and remove leading/trailing slashes
    const normalizedPath = remotePath.replace(/^\/+|\/+$/g, "");
    const parts = normalizedPath.split("/").filter((p) => p);

    // ✅ Start from home directory, not root
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      try {
        // Check if directory exists
        await new Promise<void>((resolve, reject) => {
          sftp.stat(currentPath, (err: Error, stats: any) => {
            if (err) {
              // Directory doesn't exist, create it
              sftp.mkdir(currentPath, (mkdirErr: Error) => {
                if (mkdirErr && !mkdirErr.message.includes("exists")) {
                  console.error(`Failed to create directory ${currentPath}:`, mkdirErr.message);
                  reject(mkdirErr);
                } else {
                  console.log(`✅ Created directory: ${currentPath}`);
                  resolve();
                }
              });
            } else {
              // Directory already exists
              console.log(`✅ Directory exists: ${currentPath}`);
              resolve();
            }
          });
        });
      } catch (error: any) {
        // Only throw if it's not a "file exists" error
        if (!error.message.includes("exists") && !error.message.includes("Failure")) {
          throw error;
        }
      }
    }
  }

  /**
   * Upload file to SFTP server - FIXED VERSION
   */
  async upload(
    filePath: string,
    destinationPath: string,
    mimetype: string
  ): Promise<CloudUploadResult> {
    let sftp: any;

    try {
      sftp = await this.getSftpSession();

      // Read file
      const fileSize = fs.statSync(filePath).size;
      const filename = path.basename(filePath);

      // ✅ FIXED: Normalize paths properly
      // Remove leading slash from remotePath if it exists
      const remotePath = this.config.remotePath.replace(/^\/+/, "").replace(/\/+$/, "");
      
      // Remove leading slash from destinationPath
      const destPath = destinationPath.replace(/^\/+/, "");
      
      // Combine paths (both relative to home directory)
      const fullRemotePath = remotePath ? `${remotePath}/${destPath}` : destPath;

      console.log(`📂 Uploading to: ${fullRemotePath}`);

      // ✅ Ensure remote directory exists
      const remoteDir = path.dirname(fullRemotePath).replace(/\\/g, "/");
      console.log(`📁 Ensuring directory exists: ${remoteDir}`);
      
      await this.createRemoteDirectory(sftp, remoteDir);

      // ✅ Upload file
      console.log(`📤 Uploading file: ${filePath} -> ${fullRemotePath}`);
      
      await new Promise<void>((resolve, reject) => {
        sftp.fastPut(filePath, fullRemotePath, (err: Error) => {
          if (err) {
            console.error(`❌ Upload failed:`, err.message);
            reject(err);
          } else {
            console.log(`✅ Upload successful: ${fullRemotePath}`);
            resolve();
          }
        });
      });

      // Generate URLs
      const cloudUrl = this.getPublicUrl(destPath);

      return {
        filename,
        size: fileSize,
        mimetype,
        provider: "sftp",
        cloudPath: fullRemotePath,
        cloudUrl,
        publicUrl: cloudUrl,
        metadata: {
          host: this.config.host,
          port: this.config.port || 22,
          remotePath: fullRemotePath,
        },
      };
    } catch (error: any) {
      console.error("❌ SFTP Upload Error:", error.message);
      
      if (error.message?.includes("Permission denied")) {
        throw new CloudStoragePermissionError({
          message: "Permission denied to write to SFTP server",
          info: {
            provider: "sftp",
            host: this.config.host,
            remotePath: destinationPath,
            error: error.message,
          },
        });
      }

      if (error.message?.includes("No such file")) {
        throw new CloudStorageUploadError({
          message: `Directory does not exist on SFTP server. Path: ${destinationPath}`,
          info: {
            provider: "sftp",
            host: this.config.host,
            remotePath: destinationPath,
            error: error.message,
            hint: "Make sure the base directory exists and you have write permissions",
          },
        });
      }

      throw new CloudStorageUploadError({
        message: `Failed to upload to SFTP: ${error.message}`,
        info: {
          provider: "sftp",
          host: this.config.host,
          error: error.message,
        },
      });
    } finally {
      if (sftp) {
        sftp.end();
      }
    }
  }

  /**
   * Delete file from SFTP server
   */
  async delete(cloudPath: string): Promise<void> {
    let sftp: any;

    try {
      sftp = await this.getSftpSession();

      await new Promise<void>((resolve, reject) => {
        sftp.unlink(cloudPath, (err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      throw new CloudStorageUploadError({
        message: `Failed to delete from SFTP: ${error.message}`,
        info: {
          provider: "sftp",
          cloudPath,
          error: error.message,
        },
      });
    } finally {
      if (sftp) {
        sftp.end();
      }
    }
  }

  /**
   * Get public URL for SFTP file
   */
  getPublicUrl(cloudPath: string): string {
    // If baseUrl is configured, use it
    if (this.config.baseUrl) {
      const baseUrl = this.config.baseUrl.replace(/\/$/, "");
      const path = cloudPath.startsWith("/") ? cloudPath.slice(1) : cloudPath;
      return `${baseUrl}/${path}`;
    }

    // Otherwise, construct SFTP URL (not publicly accessible)
    return `sftp://${this.config.host}:${this.config.port || 22}${
      this.config.remotePath
    }/${cloudPath}`;
  }

  /**
   * Get CDN URL (same as public URL for SFTP)
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
      (this.config.password || this.config.privateKey) &&
      this.config.remotePath
    );
  }

  /**
   * Disconnect from SFTP server
   */
  async disconnect(): Promise<void> {
    if (this.sftpClient && this.isConnected) {
      this.sftpClient.end();
      this.isConnected = false;
    }
  }
}