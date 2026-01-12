# Upload Smith

**A powerful, config-driven file upload utility for Express.js built on top of Multer with advanced features.**

[![npm version](https://img.shields.io/npm/v/upload-smith.svg)](https://www.npmjs.com/package/upload-smith)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Simple Configuration** - One config object for all upload settings
- 📁 **Smart Folder Organization** - Organize by extension or custom categories
- 🔒 **Extension Validation** - Whitelist allowed file types
- 📏 **Per-Extension Size Limits** - Different size limits for different file types
- 🖼️ **Automatic Image Compression** - Compress images on upload with quality control
- 🧹 **Automatic Cleanup** - Delete files on errors (multer, validation, or controller errors)
- 🔄 **Partial Uploads** - Save valid files even when some fail validation
- 📝 **Custom Filenames** - Full control over file naming
- 💪 **TypeScript Support** - Full type definitions included
- 📦 **Dual Package** - Works with both ESM and CommonJS

## 📦 Installation

```bash
npm install upload-smith
```

## 🚀 Quick Start

```javascript
import express from "express";
import { createUploader } from "upload-smith";

const app = express();

// Create uploader with simple config
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 5,
  },
});

// Use as middleware
app.post("/upload", uploader.single(), (req, res) => {
  res.json({ file: req.file });
});

app.listen(3000);
```

## 📖 Documentation

### Basic Configuration

```javascript
const uploader = createUploader({
  fieldName: "file", // Required: form field name
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 10, // 10MB default limit
  },
});
```

### Per-Extension Size Limits

```javascript
const uploader = createUploader({
  fieldName: "documents",
  allowedExtensions: ["jpg", "png", "pdf", "docx"],
  sizeConfig: {
    enabled: true,
    defaultMB: 5, // Fallback for unlisted extensions
    perExtensionMB: {
      jpg: 10, // 10MB for images
      png: 10,
      pdf: 20, // 20MB for PDFs
      docx: 15, // 15MB for Word docs
    },
  },
});
```

### Image Compression

```javascript
const uploader = createUploader({
  fieldName: "photos",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true, // Enable compression
  imageQuality: 80, // 80% quality (1-100)
  sizeConfig: {
    defaultMB: 10,
  },
});
```

**Note:** Only actual image files (jpg, jpeg, png, webp, gif, tiff) are compressed. Other file types are unaffected.

### Folder Organization

**By Extension:**

```javascript
const uploader = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "uploads",
    byExtension: true, // Creates: uploads/jpg, uploads/pdf, etc.
  },
});
```

**By Category:**

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf", "docx"],
  folderConfig: {
    basePath: "uploads",
    byCategory: true,
    extensionMap: {
      jpg: "images",
      png: "images",
      pdf: "documents",
      docx: "documents",
    },
    // Creates: uploads/images, uploads/documents
  },
});
```

**Combined (Category + Extension):**

```javascript
const uploader = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "uploads",
    byCategory: true,
    byExtension: true, // Creates: uploads/images/jpg, uploads/documents/pdf
    extensionMap: {
      jpg: "images",
      png: "images",
      pdf: "documents",
    },
  },
});
```

### Custom Filenames

```javascript
const uploader = createUploader({
  fieldName: "avatar",
  filename: (req, file) => {
    const userId = req.headers["x-user-id"] || "anonymous";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    return `user-${userId}-${timestamp}${ext}`;
  },
});
```

**Note:** `req.body` is not available in the `filename` function. Use `req.headers`, `req.query`, or authentication middleware instead.

### Multiple Files

```javascript
const uploader = createUploader({
  fieldName: "files",
  multiple: true,
  maxFiles: 10,
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 10,
  },
});

app.post("/upload", uploader.multiple(), (req, res) => {
  res.json({ files: req.files });
});
```

### Partial Uploads (NEW! 🎉)

Save valid files even when some fail validation:

```javascript
const uploader = createUploader({
  fieldName: "files",
  allowedExtensions: ["jpg", "png", "pdf"],
  multiple: true,
  partialUpload: true, // Enable partial uploads
  sizeConfig: {
    enabled: true,
    perExtensionMB: {
      jpg: 5,
      png: 5,
      pdf: 10,
    },
  },
});

app.post("/upload", uploader.multiple(), (req, res) => {
  const uploaded = req.files;
  const rejected = req.rejectedFiles || [];

  res.json({
    uploaded: uploaded, // Valid files saved
    rejected: rejected, // Invalid files with reasons
  });
});
```

**Without `partialUpload`:** Upload 5 files, 1 invalid → ❌ ALL 5 rejected  
**With `partialUpload`:** Upload 5 files, 1 invalid → ✅ 4 saved, 1 rejected with reason

## 🎯 Complete Configuration Options

```typescript
const uploader = createUploader({
  // REQUIRED
  fieldName: string,

  // FILE VALIDATION
  allowedExtensions?: string[],

  // SIZE LIMITS
  sizeConfig?: {
    enabled?: boolean,              // Enable per-extension limits
    defaultMB?: number,             // Default/fallback size in MB
    perExtensionMB?: {
      [ext: string]: number         // Per-extension limits
    }
  },

  // FILENAME
  filename?: (req, file) => string, // Custom filename function

  // MULTIPLE FILES
  multiple?: boolean,               // Allow multiple files
  maxFiles?: number,                // Max files when multiple=true

  // FOLDER ORGANIZATION
  folderConfig?: {
    basePath?: string,              // Base directory
    autoCreate?: boolean,           // Auto-create directories
    byExtension?: boolean,          // Organize by extension
    byCategory?: boolean,           // Organize by category
    extensionMap?: {
      [ext: string]: string         // Extension to category map
    }
  },

  // ERROR HANDLING
  cleanupOnError?: boolean,         // Auto-delete files on errors

  // PARTIAL UPLOADS
  partialUpload?: boolean,          // Save valid files, reject invalid

  // IMAGE COMPRESSION
  compressImage?: boolean,          // Compress images
  imageQuality?: number,            // Compression quality (1-100)
});
```

This single section will save you **a lot of support questions**.

---

### Error Types Reference

You already have rich custom errors — documenting them increases trust.

Example:

````md
## 🚨 Error Types

Upload Smith throws structured errors with consistent shape.

### Common Errors

| Error                       | When it occurs                |
| --------------------------- | ----------------------------- |
| `InvalidConfigurationError` | Invalid uploader setup        |
| `InvalidFileExtensionError` | File type not allowed         |
| `FileSizeExceededError`     | File exceeds size limit       |
| `TooManyFilesError`         | More than `maxFiles` uploaded |
| `NoFileUploadedError`       | No file sent in request       |

All errors include:

- `type`
- `code`
- `status`
- optional `info`

## ⚠️ Configuration Errors (Important)

Upload Smith validates its configuration **at startup**.

If an invalid configuration is detected (e.g. conflicting options),
an `InvalidConfigurationError` is thrown immediately and the app will fail to start.

This is intentional and follows **fail-fast principles** used by professional libraries.

### Example
```js
createUploader({
  fieldName: 'files',
  partialUpload: true, // ❌ invalid without multiple:true
});


## 💡 Real-World Examples

### Profile Picture Upload

```javascript
const profileUploader = createUploader({
  fieldName: "profilePic",
  allowedExtensions: ["jpg", "jpeg", "png"],
  sizeConfig: { defaultMB: 5 },
  compressImage: true,
  imageQuality: 85,
  folderConfig: {
    basePath: "uploads/profiles",
  },
});

app.post("/profile", profileUploader.single(), (req, res) => {
  res.json({ profilePic: req.file });
});
```
````

### Document Management System

```javascript
const documentUploader = createUploader({
  fieldName: "documents",
  allowedExtensions: ["pdf", "docx", "xlsx"],
  multiple: true,
  maxFiles: 20,
  sizeConfig: {
    enabled: true,
    perExtensionMB: {
      pdf: 25,
      docx: 20,
      xlsx: 15,
    },
  },
  partialUpload: true,
  folderConfig: {
    basePath: "uploads/documents",
    byExtension: true,
  },
});

app.post("/documents", documentUploader.multiple(), (req, res) => {
  const uploaded = req.files;
  const rejected = req.rejectedFiles || [];

  res.json({
    uploaded: uploaded.length,
    rejected: rejected.length,
    files: uploaded,
    errors: rejected,
  });
});
```

### Media Gallery

```javascript
const galleryUploader = createUploader({
  fieldName: "media",
  allowedExtensions: ["jpg", "png", "gif", "mp4"],
  multiple: true,
  maxFiles: 50,
  sizeConfig: {
    enabled: true,
    perExtensionMB: {
      jpg: 15,
      png: 15,
      gif: 10,
      mp4: 100,
    },
  },
  compressImage: true,
  imageQuality: 80,
  partialUpload: true,
  folderConfig: {
    basePath: "uploads/gallery",
    byCategory: true,
    extensionMap: {
      jpg: "photos",
      png: "photos",
      gif: "animations",
      mp4: "videos",
    },
  },
});

app.post("/gallery", galleryUploader.multiple(), (req, res) => {
  res.json({
    uploaded: req.files,
    rejected: req.rejectedFiles || [],
  });
});
```

## 🔧 TypeScript Support

Full TypeScript definitions are included. For `req.rejectedFiles`, add this to your project:

```typescript
// express-extensions.d.ts
declare global {
  namespace Express {
    interface Request {
      rejectedFiles?: Array<{
        originalname: string;
        reason: string;
        mimetype?: string;
        size?: number;
      }>;
    }
  }
}

export {};
```

## 🧪 Testing

```bash
# Single file
curl -F "file=@photo.jpg" http://localhost:3000/upload

# Multiple files
curl -F "files=@photo1.jpg" \
     -F "files=@photo2.jpg" \
     -F "files=@document.pdf" \
     http://localhost:3000/upload

# With headers (for custom filename)
curl -H "x-user-id: 12345" \
     -F "file=@photo.jpg" \
     http://localhost:3000/upload
```

## 📊 File Object Structure

After upload, `req.file` or `req.files` contains:

```javascript
{
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/images',
  filename: '1234567890-photo.jpg',
  path: 'uploads/images/1234567890-photo.jpg',
  size: 1048576
}
```

## 🚨 Error Handling

```javascript
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large" });
  }

  if (err.message?.includes("File extension not allowed")) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  res.status(500).json({ error: "Upload failed" });
});
```

## 🔄 Automatic Cleanup

Files are automatically deleted when `cleanupOnError: true` (default) in these scenarios:

1. **Multer validation errors** (invalid extension, file too large)
2. **Custom validation errors** (size limits, etc.)
3. **Controller errors** (when response status ≥ 400)

```javascript
app.post("/upload", uploader.single(), (req, res) => {
  // If this returns error status, file is auto-deleted
  if (!processFile(req.file)) {
    return res.status(400).json({ error: "Processing failed" });
  }

  res.json({ success: true });
});
```

## 📚 API Reference

### `createUploader(config: UploadConfig)`

Creates an uploader instance.

**Returns:**

- `single()` - Middleware for single file upload
- `multiple()` - Middleware for multiple file uploads

### `asyncHandler(fn: Function)`

Wraps async route handlers to catch errors automatically.

```javascript
import { asyncHandler } from "upload-smith";

app.post(
  "/upload",
  uploader.single(),
  asyncHandler(async (req, res) => {
    await processFile(req.file);
    res.json({ success: true });
  })
);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Manan Patel](https://github.com/mananzealousweb)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/upload-smith)
- [GitHub Repository](https://github.com/mananzealousweb/upload-smith)
- [Report Issues](https://github.com/mananzealousweb/upload-smith/issues)

## 🙏 Acknowledgments

Built on top of the excellent [Multer](https://github.com/expressjs/multer) library.

Made by [Manan Patel](https://github.com/mananzealousweb)
