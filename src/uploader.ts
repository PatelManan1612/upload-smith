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
  } = config;

  validateUploaderConfig(config);

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
            })
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
                    maxSize / (1024 * 1024)
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
                    maxSize / (1024 * 1024)
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

          // Attach cleanup handler for controller errors if cleanupOnError is enabled
          if (cleanupOnError) {
            attachCleanupHandler(req, res);
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
  };
}

/**
 * Attaches a cleanup handler that will delete uploaded files if the controller fails
 */
function attachCleanupHandler(req: Request, res: Response) {
  // Store original res.status method
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  let statusCode: number | undefined;
  let responseSent = false;

  // Override status method to capture status code
  res.status = function (code: number) {
    statusCode = code;
    return originalStatus(code);
  } as any;

  // Override json method
  res.json = function (body: any) {
    responseSent = true;
    if (statusCode && statusCode >= 400) {
      performCleanup(req);
    }
    return originalJson(body);
  } as any;

  // Override send method
  res.send = function (body: any) {
    responseSent = true;
    if (statusCode && statusCode >= 400) {
      performCleanup(req);
    }
    return originalSend(body);
  } as any;

  // Handle errors passed to next()
  const originalOn = res.on.bind(res);
  res.on("finish", () => {
    // Check if response was an error based on status code
    if (res.statusCode >= 400 && !responseSent) {
      performCleanup(req);
    }
  });
}

/**
 * Performs the actual cleanup of uploaded files
 */
function performCleanup(req: Request) {
  if (req.file) {
    cleanupFile(req.file);
  }
  if (req.files) {
    cleanupFiles(req.files as Express.Multer.File[]);
  }
}