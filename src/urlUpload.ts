import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";
import { UploadConfig, UrlUploadConfig } from "./types.js";
import {
  validateUrl,
  validateDomain,
  validateAndSanitizeFilename,
  validateExtension,
} from "./validators.js";
import {
  FileSizeExceededError,
  NetworkError,
  UploadTimeoutError,
  TooManyRedirectsError,
  HttpError,
  InvalidFileExtensionError,
} from "./error.js";
import { resolveFileSizeLimit, resolveUploadPath } from "./helpers.js";
import { compressImage } from "./compress.js";

/**
 * Result of URL download
 */
export interface UrlDownloadResult {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  originalUrl: string;
  finalUrl: string;
}

/**
 * Downloads a file from URL WITH FULL UPLOADER CONFIG VALIDATION
 * This respects: allowedExtensions, sizeConfig, folderConfig
 */
export async function downloadFromUrl(
  urlString: string,
  uploaderConfig: UploadConfig,
): Promise<UrlDownloadResult> {
  const urlConfig = uploaderConfig.urlUpload;

  if (!urlConfig?.enabled) {
    throw new Error("URL upload is not enabled in configuration");
  }

  // Validate URL format and protocol
  const url = validateUrl(urlString);

  // Validate domain restrictions
  validateDomain(url, urlConfig.allowedDomains, urlConfig.blockedDomains);

  // Generate safe filename
  let filename = validateAndSanitizeFilename(url);

  // ============================================================================
  // STEP 1: VALIDATE FILE EXTENSION (like regular uploads)
  // ============================================================================
  const ext = path.extname(filename).slice(1).toLowerCase();

  // Create a mock Multer file object for validation
  const mockFile: Express.Multer.File = {
    fieldname: uploaderConfig.fieldName,
    originalname: filename,
    encoding: "7bit",
    mimetype: "application/octet-stream", // Will be updated after download
    size: 0,
    destination: "",
    filename: filename,
    path: "",
    buffer: Buffer.from(""),
    stream: {} as any,
  };

  // Validate extension using the same function as regular uploads
  if (!validateExtension(mockFile, uploaderConfig.allowedExtensions)) {
    throw new InvalidFileExtensionError({
      message: `File extension '${ext}' is not allowed`,
      info: {
        filename: filename,
        extension: ext,
        allowedExtensions: uploaderConfig.allowedExtensions,
      },
    });
  }

  // ============================================================================
  // STEP 2: RESOLVE DESTINATION FOLDER (using folderConfig)
  // ============================================================================
  const destination = resolveUploadPath(mockFile, uploaderConfig.folderConfig);

  // ============================================================================
  // STEP 3: RESOLVE SIZE LIMIT (using sizeConfig)
  // ============================================================================
  const configMaxSize = resolveFileSizeLimit(
    mockFile,
    uploaderConfig.sizeConfig,
  );
  const urlMaxSize = (urlConfig.maxSizeMB || 50) * 1024 * 1024;
  const maxSize = Math.min(configMaxSize, urlMaxSize); // Use stricter limit

  // ============================================================================
  // STEP 4: DOWNLOAD FILE
  // ============================================================================
  const filepath = path.join(destination, filename);
  const timeout = urlConfig.timeout || 30000;
  const maxRedirects = urlConfig.maxRedirects || 5;
  const followRedirects = urlConfig.followRedirects !== false;
  const userAgent = urlConfig.userAgent || "upload-smith";

  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    let downloadedSize = 0;
    let finalUrl = urlString;
    let actualMimetype = "application/octet-stream";

    const makeRequest = (currentUrl: URL): void => {
      const protocol = currentUrl.protocol === "https:" ? https : http;

      const options = {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          ...(urlConfig.headers || {}),
        },
        timeout: timeout,
      };

      const request = protocol.get(
        currentUrl.toString(),
        options,
        (response) => {
          // Handle redirects
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            if (!followRedirects) {
              request.destroy();
              reject(
                new NetworkError({
                  message: "Redirects are not enabled",
                  info: {
                    url: urlString,
                    redirectTo: response.headers.location,
                  },
                }),
              );
              return;
            }

            redirectCount++;
            if (redirectCount > maxRedirects) {
              request.destroy();
              reject(
                new TooManyRedirectsError({
                  message: `Exceeded maximum of ${maxRedirects} redirects`,
                  info: {
                    url: urlString,
                    maxRedirects,
                    redirectCount,
                  },
                }),
              );
              return;
            }

            try {
              const redirectUrl = new URL(
                response.headers.location,
                currentUrl.toString(),
              );

              validateUrl(redirectUrl.toString());
              validateDomain(
                redirectUrl,
                urlConfig.allowedDomains,
                urlConfig.blockedDomains,
              );

              finalUrl = redirectUrl.toString();
              makeRequest(redirectUrl);
            } catch (error: any) {
              request.destroy();
              reject(error);
            }
            return;
          }

          // Check status code
          if (response.statusCode !== 200) {
            request.destroy();
            reject(
              new HttpError({
                message: `HTTP ${response.statusCode}: ${
                  response.statusMessage || "Unknown error"
                }`,
                info: {
                  url: urlString,
                  statusCode: response.statusCode,
                  statusMessage: response.statusMessage,
                },
              }),
            );
            return;
          }

          // Get actual MIME type
          actualMimetype =
            response.headers["content-type"] || "application/octet-stream";

          // Check content length if available
          const contentLength = parseInt(
            response.headers["content-length"] || "0",
            10,
          );

          if (contentLength > 0 && contentLength > maxSize) {
            request.destroy();
            reject(
              new FileSizeExceededError({
                message: `File size ${Math.round(
                  contentLength / (1024 * 1024),
                )}MB exceeds maximum ${Math.round(maxSize / (1024 * 1024))}MB`,
                info: {
                  url: urlString,
                  fileSize: contentLength,
                  maxSize: maxSize,
                  maxSizeMB: Math.round(maxSize / (1024 * 1024)),
                },
              }),
            );
            return;
          }

          // Create write stream
          const fileStream = fs.createWriteStream(filepath);

          // Track downloaded size during transfer
          response.on("data", (chunk: Buffer) => {
            downloadedSize += chunk.length;

            if (downloadedSize > maxSize) {
              request.destroy();
              fileStream.close();

              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
              }

              reject(
                new FileSizeExceededError({
                  message: `Downloaded size exceeds maximum ${Math.round(
                    maxSize / (1024 * 1024),
                  )}MB`,
                  info: {
                    url: urlString,
                    downloadedSize,
                    maxSize,
                    maxSizeMB: Math.round(maxSize / (1024 * 1024)),
                  },
                }),
              );
            }
          });

          response.pipe(fileStream);

          fileStream.on("finish", async () => {
            fileStream.close();

            try {
              // ============================================================================
              // STEP 5: APPLY IMAGE COMPRESSION (if enabled)
              // Using the SAME compressImage function as the regular uploader
              // ============================================================================

              // Create a complete Multer file object for compression
              const fileForCompression: Express.Multer.File = {
                fieldname: uploaderConfig.fieldName,
                originalname: filename,
                encoding: "7bit",
                mimetype: actualMimetype,
                size: downloadedSize,
                destination: destination,
                filename: filename,
                path: filepath,
                buffer: Buffer.from(""),
                stream: {} as any,
              };

              // Apply compression using the existing function (same as regular uploader)
              if (uploaderConfig.compressImage) {
                const imageQuality = uploaderConfig.imageQuality || 80;
                await compressImage(fileForCompression, imageQuality);
              }

              // Get the final file size after potential compression
              const stats = fs.statSync(fileForCompression.path);
              const finalSize = stats.size;

              // Return the result with updated path and size
              resolve({
                filename: fileForCompression.filename,
                path: fileForCompression.path,
                size: finalSize,
                mimetype: actualMimetype,
                originalUrl: urlString,
                finalUrl,
              });
            } catch (error: any) {
              // Clean up on any error
              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
              }

              reject(
                new Error(`Post-download processing failed: ${error.message}`),
              );
            }
          });

          fileStream.on("error", (error) => {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }

            reject(
              new NetworkError({
                message: `Failed to write file: ${error.message}`,
                info: {
                  url: urlString,
                  error: error.message,
                },
              }),
            );
          });
        },
      );

      request.on("timeout", () => {
        request.destroy();

        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }

        reject(
          new UploadTimeoutError({
            message: `Request timed out after ${timeout}ms`,
            info: {
              url: urlString,
              timeout,
            },
          }),
        );
      });

      request.on("error", (error) => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }

        reject(
          new NetworkError({
            message: `Network error: ${error.message}`,
            info: {
              url: urlString,
              error: error.message,
            },
          }),
        );
      });
    };

    makeRequest(url);
  });
}
/**
 * Downloads a file from URL with all validations and restrictions
 */
// export async function downloadFromUrl(
//   urlString: string,
//   destination: string,
//   config: UrlUploadConfig
// ): Promise<UrlDownloadResult> {
//   // Validate URL format and protocol
//   const url = validateUrl(urlString);

//   // Validate domain restrictions
//   validateDomain(url, config.allowedDomains);

//   // Generate safe filename
//   const filename = validateAndSanitizeFilename(url);
//   const filepath = path.join(destination, filename);

//   // Configuration with defaults
//   const maxSize = (config.maxSizeMB || 50) * 1024 * 1024;
//   const timeout = config.timeout || 30000;
//   const maxRedirects = config.maxRedirects || 5;
//   const followRedirects = config.followRedirects !== false;
//   const userAgent = config.userAgent || "upload-smith";

//   return new Promise((resolve, reject) => {
//     let redirectCount = 0;
//     let downloadedSize = 0;
//     let finalUrl = urlString;

//     const makeRequest = (currentUrl: URL): void => {
//       const protocol = currentUrl.protocol === "https:" ? https : http;

//       const options = {
//         method: "GET",
//         headers: {
//           "User-Agent": userAgent,
//           ...(config.headers || {}),
//         },
//         timeout: timeout,
//       };

//       const request = protocol.get(
//         currentUrl.toString(),
//         options,
//         (response) => {
//           // Handle redirects
//           if (
//             response.statusCode &&
//             response.statusCode >= 300 &&
//             response.statusCode < 400 &&
//             response.headers.location
//           ) {
//             if (!followRedirects) {
//               request.destroy();
//               reject(
//                 new NetworkError({
//                   message: "Redirects are not enabled",
//                   info: {
//                     url: urlString,
//                     redirectTo: response.headers.location,
//                   },
//                 })
//               );
//               return;
//             }

//             redirectCount++;
//             if (redirectCount > maxRedirects) {
//               request.destroy();
//               reject(
//                 new TooManyRedirectsError({
//                   message: `Exceeded maximum of ${maxRedirects} redirects`,
//                   info: {
//                     url: urlString,
//                     maxRedirects,
//                     redirectCount,
//                   },
//                 })
//               );
//               return;
//             }

//             try {
//               const redirectUrl = new URL(
//                 response.headers.location,
//                 currentUrl.toString()
//               );

//               // Validate redirect URL
//               validateUrl(redirectUrl.toString());
//               validateDomain(redirectUrl, config.allowedDomains);

//               finalUrl = redirectUrl.toString();
//               makeRequest(redirectUrl);
//             } catch (error: any) {
//               request.destroy();
//               reject(error);
//             }
//             return;
//           }

//           // Check status code
//           if (response.statusCode !== 200) {
//             request.destroy();
//             reject(
//               new HttpError({
//                 message: `HTTP ${response.statusCode}: ${
//                   response.statusMessage || "Unknown error"
//                 }`,
//                 info: {
//                   url: urlString,
//                   statusCode: response.statusCode,
//                   statusMessage: response.statusMessage,
//                 },
//               })
//             );
//             return;
//           }

//           // Check content length if available
//           const contentLength = parseInt(
//             response.headers["content-length"] || "0",
//             10
//           );

//           if (contentLength > 0 && contentLength > maxSize) {
//             request.destroy();
//             reject(
//               new FileSizeExceededError({
//                 message: `File size ${Math.round(
//                   contentLength / (1024 * 1024)
//                 )}MB exceeds maximum ${config.maxSizeMB}MB`,
//                 info: {
//                   url: urlString,
//                   fileSize: contentLength,
//                   maxSize: maxSize,
//                   maxSizeMB: config.maxSizeMB,
//                 },
//               })
//             );
//             return;
//           }

//           // Create write stream
//           const fileStream = fs.createWriteStream(filepath);

//           // Track downloaded size during transfer
//           response.on("data", (chunk: Buffer) => {
//             downloadedSize += chunk.length;

//             // Check size limit during download
//             if (downloadedSize > maxSize) {
//               request.destroy();
//               fileStream.close();

//               // Cleanup partial file
//               if (fs.existsSync(filepath)) {
//                 fs.unlinkSync(filepath);
//               }

//               reject(
//                 new FileSizeExceededError({
//                   message: `Downloaded size exceeds maximum ${config.maxSizeMB}MB`,
//                   info: {
//                     url: urlString,
//                     downloadedSize,
//                     maxSize,
//                     maxSizeMB: config.maxSizeMB,
//                   },
//                 })
//               );
//             }
//           });

//           // Pipe response to file
//           response.pipe(fileStream);

//           fileStream.on("finish", () => {
//             fileStream.close();

//             resolve({
//               filename,
//               path: filepath,
//               size: downloadedSize,
//               mimetype:
//                 response.headers["content-type"] || "application/octet-stream",
//               originalUrl: urlString,
//               finalUrl,
//             });
//           });

//           fileStream.on("error", (error) => {
//             // Cleanup on error
//             if (fs.existsSync(filepath)) {
//               fs.unlinkSync(filepath);
//             }

//             reject(
//               new NetworkError({
//                 message: `Failed to write file: ${error.message}`,
//                 info: {
//                   url: urlString,
//                   error: error.message,
//                 },
//               })
//             );
//           });
//         }
//       );

//       // Handle timeout
//       request.on("timeout", () => {
//         request.destroy();

//         // Cleanup partial file
//         if (fs.existsSync(filepath)) {
//           fs.unlinkSync(filepath);
//         }

//         reject(
//           new UploadTimeoutError({
//             message: `Request timed out after ${timeout}ms`,
//             info: {
//               url: urlString,
//               timeout,
//             },
//           })
//         );
//       });

//       // Handle network errors
//       request.on("error", (error) => {
//         // Cleanup partial file
//         if (fs.existsSync(filepath)) {
//           fs.unlinkSync(filepath);
//         }

//         reject(
//           new NetworkError({
//             message: `Network error: ${error.message}`,
//             info: {
//               url: urlString,
//               error: error.message,
//             },
//           })
//         );
//       });
//     };

//     // Start the download
//     makeRequest(url);
//   });
// }
