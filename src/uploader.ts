import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { UploadConfig } from "./types.js";
import { validateExtension } from "./validators.js";
import { resolveUploadPath, resolveFileSizeLimit } from "./helpers.js";
import { cleanupFile, cleanupFiles } from "./cleanup.js";
import { compressImage } from "./compress.js";

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
    compressImage: shouldCompress = false,
    imageQuality = 80,
  } = config;

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
      if (!validateExtension(file, allowedExtensions)) {
        return cb(new Error("File extension not allowed"));
      }
      cb(null, true);
    },
    limits: {
      fileSize: sizeConfig?.defaultMB
        ? sizeConfig.defaultMB * 1024 * 1024
        : undefined,
    },
  });

  const wrap = (middleware: any) => async (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, async (err: any) => {
      if (err) {
        if (cleanupOnError) {
          cleanupFile(req.file);
          cleanupFiles(req.files as Express.Multer.File[]);
        }
        return next(err);
      }

      try {
        const files = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];

        for (const file of files) {
          const maxSize = resolveFileSizeLimit(file, sizeConfig);

          if (file.size > maxSize) {
            throw new Error(`File ${file.originalname} exceeds size limit`);
          }

          if (shouldCompress) {
            await compressImage(file, imageQuality);
          }
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
  res.status = function(code: number) {
    statusCode = code;
    return originalStatus(code);
  } as any;

  // Override json method
  res.json = function(body: any) {
    responseSent = true;
    if (statusCode && statusCode >= 400) {
      performCleanup(req);
    }
    return originalJson(body);
  } as any;

  // Override send method
  res.send = function(body: any) {
    responseSent = true;
    if (statusCode && statusCode >= 400) {
      performCleanup(req);
    }
    return originalSend(body);
  } as any;

  // Handle errors passed to next()
  const originalOn = res.on.bind(res);
  res.on('finish', () => {
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