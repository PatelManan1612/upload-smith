import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { UploadConfig } from "./types.js";
import { validateExtension, validateUploaderConfig } from "./validators.js";
import {
  resolveUploadPath,
  resolveFileSizeLimit,
  mapMulterError,
} from "./helpers.js";
import { cleanupFile, cleanupFiles } from "./cleanup.js";
import { compressImage } from "./compress.js";
import {
  FileSizeExceededError,
  InvalidFileExtensionError,
  NoFileUploadedError,
} from "./error.js";
import { CloudStorageService } from "./cloudStorage.js";

export function createUploader(config: UploadConfig) {
  const {
    fieldName,
    allowedExtensions,
    sizeConfig,
    filename,
    multiple = false,
    maxFiles = 5,
    folderConfig,
    cleanupOnError = true,
    partialUpload = false,
    compressImage: shouldCompress = false,
    imageQuality = 80,
    cloudStorage: cloudStorageConfig, // ✅ NEW
  } = config;

  validateUploaderConfig(config);

  // ✅ Initialize cloud storage service if enabled
  let cloudStorage: CloudStorageService | null = null;
  if (cloudStorageConfig?.enabled) {
    cloudStorage = new CloudStorageService(cloudStorageConfig);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, resolveUploadPath(file, folderConfig));
    },
    filename: (req, file, cb) => {
      const name =
        filename?.(req, file) ?? `${Date.now()}-${file.originalname}`;
      cb(null, name);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      // Initialize rejectedFiles array if it doesn't exist
      if (!req.rejectedFiles) {
        (req as any).rejectedFiles = [];
      }

      if (!validateExtension(file, allowedExtensions)) {
        // If partialUpload is enabled, track and skip invalid files
        if (partialUpload && multiple) {
          (req as any).rejectedFiles.push({
            originalname: file.originalname,
            reason: "File extension not allowed",
            mimetype: file.mimetype,
            size: file.size,
          });
          return cb(null, false); // Skip this file but continue
        }

        // Throw custom error
        const error = new InvalidFileExtensionError({
          message: `File extension not allowed: ${file.originalname}`,
          info: {
            filename: file.originalname,
            mimetype: file.mimetype,
            allowedExtensions: allowedExtensions,
          },
        });
        return cb(error as any);
      }
      cb(null, true);
    },
    limits: {
      fileSize:
        sizeConfig?.enabled && sizeConfig?.perExtensionMB
          ? undefined // Don't set global limit when using per-extension
          : sizeConfig?.defaultMB
            ? sizeConfig.defaultMB * 1024 * 1024
            : undefined,
    },
  });

  const wrap =
    (middleware: any) =>
    async (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, async (err: any) => {
        if (err) {
          if (cleanupOnError) {
            cleanupFile(req.file);
            cleanupFiles(req.files as Express.Multer.File[]);
          }
          return next(
            mapMulterError(err, fieldName, {
              maxFiles,
            }),
          );
        }

        try {
          if (!req.file && (!req.files || req.files.length === 0)) {
            throw new NoFileUploadedError({
              info: { fieldName },
            });
          }
          const files = req.file
            ? [req.file]
            : (req.files as Express.Multer.File[]) || [];
          const validFiles: Express.Multer.File[] = [];

          // Get existing rejected files from fileFilter or initialize
          const rejectedFiles: Array<{
            originalname: string;
            reason: string;
            mimetype?: string;
            size?: number;
          }> = (req as any).rejectedFiles || [];

          for (const file of files) {
            const maxSize = resolveFileSizeLimit(file, sizeConfig);

            if (file.size > maxSize) {
              if (partialUpload && multiple) {
                // Track rejected file and cleanup
                rejectedFiles.push({
                  originalname: file.originalname,
                  reason: `File exceeds size limit of ${Math.round(
                    maxSize / (1024 * 1024),
                  )}MB`,
                  mimetype: file.mimetype,
                  size: file.size,
                });
                cleanupFile(file);
                continue; // Skip to next file
              } else {
                // Throw custom error
                throw new FileSizeExceededError({
                  message: `File ${
                    file.originalname
                  } exceeds size limit of ${Math.round(
                    maxSize / (1024 * 1024),
                  )}MB`,
                  info: {
                    filename: file.originalname,
                    fileSize: file.size,
                    maxSize: maxSize,
                    maxSizeMB: Math.round(maxSize / (1024 * 1024)),
                  },
                });
              }
            }

            if (shouldCompress) {
              await compressImage(file, imageQuality);
            }

            validFiles.push(file);
          }

          // Update req.files with only valid files and attach all rejected files info
          if (multiple && partialUpload) {
            req.files = validFiles;
            (req as any).rejectedFiles = rejectedFiles;
          }

          // ✅ NEW: Upload to cloud storage if enabled
          if (cloudStorage) {
            try {
              const filesToUpload = req.file ? [req.file] : validFiles;

              for (const file of filesToUpload) {
                const result = await cloudStorage.uploadFile(file);

                // Attach cloud info to file object
                (file as any).cloudUrl = result.cloudUrl;
                (file as any).cloudPath = result.cloudPath;
                (file as any).publicUrl = result.publicUrl;
                (file as any).cdnUrl = result.cdnUrl;
                (file as any).cloudProvider = result.provider;
                (file as any).cloudMetadata = result.metadata;
              }
            } catch (cloudError: any) {
              console.error("Cloud upload error:", cloudError.message);

              // Cleanup cloud files that were uploaded
              if (cloudStorage.getTrackedUploadsCount() > 0) {
                try {
                  await cloudStorage.cleanupAllUploads();
                  console.log("✅ Cloud files cleaned up after error");
                } catch (cleanupErr) {
                  console.error("❌ Cloud cleanup failed:", cleanupErr);
                }
              }

              // Cleanup local files
              if (cleanupOnError) {
                cleanupFile(req.file);
                cleanupFiles(req.files as Express.Multer.File[]);
              }

              throw cloudError;
            }
          }

          // Attach cleanup handler for controller errors if cleanupOnError is enabled
          if (cleanupOnError) {
            attachCleanupHandler(req, res, cloudStorage);
          }

          next();
        } catch (e) {
          if (cleanupOnError) {
            cleanupFile(req.file);
            cleanupFiles(req.files as Express.Multer.File[]);
          }
          next(e);
        }
      });
    };

  return {
    single: () => wrap(upload.single(fieldName)),
    multiple: () => wrap(upload.array(fieldName, maxFiles)),
    config: config,
    cloudStorage, // ✅ Expose cloud storage service
  };
}

/**
 * Attaches a cleanup handler that will delete uploaded files if the controller fails
 * ✅ ENHANCED: Now also cleans up cloud files
 */
function attachCleanupHandler(
  req: Request,
  res: Response,
  cloudStorage: CloudStorageService | null,
) {
  // Store original res.status method
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  let statusCode: number | undefined;
  let responseSent = false;
  let cleanupPerformed = false; // ✅ Track if cleanup already done

  // Override status method to capture status code
  res.status = function (code: number) {
    statusCode = code;
    return originalStatus(code);
  } as any;

  // Override json method
  res.json = function (body: any) {
    responseSent = true;

    // ✅ Only cleanup once
    if (!cleanupPerformed) {
      if (statusCode && statusCode >= 400) {
        performCleanup(req, cloudStorage);
        cleanupPerformed = true;
      } else if (cloudStorage) {
        cloudStorage.clearTracking();
      }
    }

    return originalJson(body);
  } as any;

  // Override send method
  res.send = function (body: any) {
    responseSent = true;

    // ✅ Only cleanup once
    if (!cleanupPerformed) {
      if (statusCode && statusCode >= 400) {
        performCleanup(req, cloudStorage);
        cleanupPerformed = true;
      } else if (cloudStorage) {
        cloudStorage.clearTracking();
      }
    }

    return originalSend(body);
  } as any;

  // Handle errors passed to next()
  res.on("finish", () => {
    // ✅ Only cleanup if not already done
    if (!cleanupPerformed) {
      if (res.statusCode >= 400 && !responseSent) {
        performCleanup(req, cloudStorage);
        cleanupPerformed = true;
      } else if (res.statusCode < 400 && cloudStorage) {
        cloudStorage.clearTracking();
      }
    }
  });
}

/**
 * Performs the actual cleanup of uploaded files
 * ✅ ENHANCED: Now also cleans up cloud files
 */
function performCleanup(
  req: Request,
  cloudStorage: CloudStorageService | null,
) {
  // Cleanup local files
  if (req.file) {
    cleanupFile(req.file);
  }
  if (req.files) {
    cleanupFiles(req.files as Express.Multer.File[]);
  }

  // ✅ Cleanup cloud files
  if (cloudStorage && cloudStorage.getTrackedUploadsCount() > 0) {
    cloudStorage
      .cleanupAllUploads()
      .then(() => console.log("✅ Cloud files cleaned up"))
      .catch((err) => console.error("❌ Cloud cleanup failed:", err.message));
  }
}
