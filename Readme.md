# Upload Smith

**A powerful, config-driven file upload utility for Express.js built on top of Multer with advanced features including URL downloads.**

[![npm version](https://img.shields.io/npm/v/upload-smith.svg)](https://www.npmjs.com/package/upload-smith)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Simple Configuration** - One config object for all upload settings
- 📥 **URL Download Support** - Download and process files from URLs with full validation
- 🔒 **Domain Control** - Whitelist/blacklist domains for URL uploads
- 📁 **Smart Folder Organization** - Organize by extension or custom categories
- 🔐 **Extension Validation** - Whitelist allowed file types
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

### Basic File Upload

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

### URL Upload (New! 🎉)

```javascript
import express from "express";
import { createUploader, downloadFromUrl } from "upload-smith";

const app = express();
app.use(express.json());

const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true,
  imageQuality: 80,
  folderConfig: {
    basePath: "uploads/images",
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 20,
    allowedDomains: ["imgur.com", "picsum.photos"],
  },
});

app.post("/upload-from-url", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, uploader.config);
    res.json({ success: true, file: result });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});
```

## 📖 Documentation

### Table of Contents
- [Basic Configuration](#basic-configuration)
- [URL Upload Feature](#url-upload-feature-new-)
- [Per-Extension Size Limits](#per-extension-size-limits)
- [Image Compression](#image-compression)
- [Folder Organization](#folder-organization)
- [Custom Filenames](#custom-filenames)
- [Multiple Files](#multiple-files)
- [Partial Uploads](#partial-uploads-new-)
- [Complete Configuration Options](#-complete-configuration-options)
- [Error Types Reference](#-error-types-reference)
- [Real-World Examples](#-real-world-examples)

---

## Basic Configuration

```javascript
const uploader = createUploader({
  fieldName: "file", // Required: form field name
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 10, // 10MB default limit
  },
});
```

---

## URL Upload Feature (NEW! 🎉)

Download and process files directly from URLs with the same validation and processing as regular uploads.

### Basic URL Upload

```javascript
import { createUploader, downloadFromUrl } from "upload-smith";

const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "webp"],
  folderConfig: {
    basePath: "uploads/url-downloads",
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 20,
    timeout: 30000, // 30 seconds
  },
});

app.post("/download-image", async (req, res) => {
  const { url } = req.body;

  try {
    const result = await downloadFromUrl(url, uploader.config);
    
    res.json({
      success: true,
      file: {
        filename: result.filename,
        path: result.path,
        size: result.size,
        mimetype: result.mimetype,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});
```

### Domain Whitelist (Allow Only Trusted Domains)

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png"],
  urlUpload: {
    enabled: true,
    allowedDomains: [
      "imgur.com",        // Allows imgur.com and i.imgur.com
      "picsum.photos",    // Allows picsum.photos
      "unsplash.com",     // Allows unsplash.com and images.unsplash.com
    ],
  },
});

// ✅ Allowed: https://i.imgur.com/abc123.jpg
// ✅ Allowed: https://picsum.photos/200/300
// ❌ Blocked: https://malicious-site.com/image.jpg (not in whitelist)
```

### Domain Blacklist (Block Specific Domains)

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png"],
  urlUpload: {
    enabled: true,
    blockedDomains: [
      "malicious.com",
      "spam-site.net",
      "untrusted.org",
    ],
    // No allowedDomains = allow all domains EXCEPT blocked ones
  },
});

// ✅ Allowed: https://imgur.com/abc123.jpg
// ✅ Allowed: https://any-other-site.com/image.png
// ❌ Blocked: https://malicious.com/image.jpg
```

### Combined Whitelist + Blacklist (Maximum Security)

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png"],
  urlUpload: {
    enabled: true,
    // Only these domains allowed
    allowedDomains: [
      "imgur.com",
      "picsum.photos",
      "cdn.example.com",
    ],
    // Block specific subdomains even if parent is whitelisted
    blockedDomains: [
      "spam.cdn.example.com", // Block this subdomain
    ],
  },
});

// Blacklist is checked FIRST, then whitelist
// ✅ Allowed: https://imgur.com/image.jpg (whitelisted, not blacklisted)
// ✅ Allowed: https://cdn.example.com/file.png (whitelisted, not blacklisted)
// ❌ Blocked: https://spam.cdn.example.com/bad.jpg (blacklisted)
// ❌ Blocked: https://unsplash.com/photo.jpg (not whitelisted)
```

### URL Upload with Compression

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true,      // Enable compression for URL downloads
  imageQuality: 70,         // 70% quality
  folderConfig: {
    basePath: "uploads/compressed",
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 25,
    allowedDomains: ["imgur.com", "picsum.photos"],
  },
});

// Downloaded images are automatically compressed!
```

### Advanced URL Upload Configuration

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  urlUpload: {
    enabled: true,
    maxSizeMB: 50,              // Max download size
    timeout: 60000,             // 60 second timeout
    maxRedirects: 5,            // Follow up to 5 redirects
    followRedirects: true,      // Enable redirect following
    userAgent: "Mozilla/5.0",   // Custom User-Agent
    headers: {
      "Accept": "image/*",      // Custom headers
      "X-Custom": "value",
    },
    allowedDomains: [
      "trusted-cdn.com",
    ],
    blockedDomains: [
      "banned-site.com",
    ],
  },
});
```

### URL Upload Error Handling

```javascript
app.post("/download", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, uploader.config);
    res.json({ success: true, file: result });
  } catch (error) {
    // Handle specific errors
    if (error.code === "DOMAIN_BLOCKED") {
      return res.status(403).json({
        error: "This domain is not allowed",
        domain: error.info.domain,
      });
    }

    if (error.code === "DOMAIN_NOT_ALLOWED") {
      return res.status(403).json({
        error: "Only whitelisted domains are allowed",
        allowedDomains: error.info.allowedDomains,
      });
    }

    if (error.code === "FILE_SIZE_EXCEEDED") {
      return res.status(413).json({
        error: "File is too large",
        maxSize: error.info.maxSizeMB + "MB",
      });
    }

    if (error.code === "UPLOAD_TIMEOUT") {
      return res.status(408).json({
        error: "Download timed out",
      });
    }

    // Generic error
    res.status(error.status || 500).json({
      error: error.message,
    });
  }
});
```

### Testing URL Uploads

```bash
# Download from URL
curl -X POST http://localhost:3000/download-image \
  -H "Content-Type: application/json" \
  -d '{"url": "https://picsum.photos/800/600"}'

# Test blocked domain
curl -X POST http://localhost:3000/download-image \
  -H "Content-Type: application/json" \
  -d '{"url": "https://malicious.com/image.jpg"}'
```

---

## Per-Extension Size Limits

```javascript
const uploader = createUploader({
  fieldName: "documents",
  allowedExtensions: ["jpg", "png", "pdf", "docx"],
  sizeConfig: {
    enabled: true,
    defaultMB: 5, // Fallback for unlisted extensions
    perExtensionMB: {
      jpg: 10,  // 10MB for images
      png: 10,
      pdf: 20,  // 20MB for PDFs
      docx: 15, // 15MB for Word docs
    },
  },
});
```

---

## Image Compression

```javascript
const uploader = createUploader({
  fieldName: "photos",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true, // Enable compression
  imageQuality: 80,    // 80% quality (1-100)
  sizeConfig: {
    defaultMB: 10,
  },
});
```

**Note:** Compression works for both regular uploads AND URL downloads. Only actual image files (jpg, jpeg, png, webp, gif, tiff) are compressed. Other file types are unaffected.

---

## Folder Organization

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

---

## Custom Filenames

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

---

## Multiple Files

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

---

## Partial Uploads (NEW! 🎉)

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

---

## 🎯 Complete Configuration Options

```typescript
const uploader = createUploader({
  // ==================== REQUIRED ====================
  fieldName: string,

  // ==================== FILE VALIDATION ====================
  allowedExtensions?: string[],

  // ==================== SIZE LIMITS ====================
  sizeConfig?: {
    enabled?: boolean,              // Enable per-extension limits
    defaultMB?: number,             // Default/fallback size in MB
    perExtensionMB?: {
      [ext: string]: number         // Per-extension limits
    }
  },

  // ==================== URL UPLOAD (NEW!) ====================
  urlUpload?: {
    enabled: boolean,               // Enable URL downloads
    maxSizeMB?: number,             // Max download size (default: 50MB)
    timeout?: number,               // Timeout in ms (default: 30000)
    allowedDomains?: string[],      // Whitelist of allowed domains
    blockedDomains?: string[],      // Blacklist of blocked domains
    maxRedirects?: number,          // Max redirects (default: 5)
    followRedirects?: boolean,      // Follow redirects (default: true)
    userAgent?: string,             // Custom User-Agent
    headers?: Record<string, string> // Custom HTTP headers
  },

  // ==================== FILENAME ====================
  filename?: (req, file) => string, // Custom filename function

  // ==================== MULTIPLE FILES ====================
  multiple?: boolean,               // Allow multiple files
  maxFiles?: number,                // Max files when multiple=true

  // ==================== FOLDER ORGANIZATION ====================
  folderConfig?: {
    basePath?: string,              // Base directory
    autoCreate?: boolean,           // Auto-create directories
    byExtension?: boolean,          // Organize by extension
    byCategory?: boolean,           // Organize by category
    extensionMap?: {
      [ext: string]: string         // Extension to category map
    }
  },

  // ==================== ERROR HANDLING ====================
  cleanupOnError?: boolean,         // Auto-delete files on errors

  // ==================== PARTIAL UPLOADS ====================
  partialUpload?: boolean,          // Save valid files, reject invalid

  // ==================== IMAGE COMPRESSION ====================
  compressImage?: boolean,          // Compress images (works for uploads & URL downloads)
  imageQuality?: number,            // Compression quality (1-100)
});
```

---

## 🚨 Error Types Reference

Upload Smith throws structured errors with consistent shape.

### URL Upload Errors

| Error | Code | Status | When it occurs |
|-------|------|--------|----------------|
| `DomainBlockedError` | `DOMAIN_BLOCKED` | 403 | Domain is in blocklist |
| `DomainNotAllowedError` | `DOMAIN_NOT_ALLOWED` | 403 | Domain not in whitelist |
| `InvalidUrlError` | `INVALID_URL` | 400 | Malformed URL or invalid protocol |
| `TooManyRedirectsError` | `TOO_MANY_REDIRECTS` | 502 | Exceeded max redirects |
| `UploadTimeoutError` | `UPLOAD_TIMEOUT` | 408 | Download timed out |
| `HttpError` | `HTTP_ERROR` | varies | Non-200 HTTP response |
| `NetworkError` | `NETWORK_ERROR` | 502 | Network/connection failure |

### Regular Upload Errors

| Error | Code | Status | When it occurs |
|-------|------|--------|----------------|
| `InvalidConfigurationError` | `INVALID_CONFIGURATION` | 500 | Invalid uploader setup |
| `InvalidFileExtensionError` | `INVALID_FILE_EXTENSION` | 400 | File type not allowed |
| `FileSizeExceededError` | `FILE_SIZE_EXCEEDED` | 413 | File exceeds size limit |
| `TooManyFilesError` | `TOO_MANY_FILES` | 400 | More than `maxFiles` uploaded |
| `NoFileUploadedError` | `NO_FILE_UPLOADED` | 400 | No file sent in request |

All errors include:
- `message` - Human-readable error message
- `code` - Machine-readable error code
- `status` - HTTP status code
- `info` - Additional context (optional)

---

## 💡 Real-World Examples

### Profile Picture Upload (with URL support)

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
  urlUpload: {
    enabled: true,
    maxSizeMB: 5,
    allowedDomains: ["gravatar.com", "imgur.com"],
  },
});

// Regular file upload
app.post("/profile/upload", profileUploader.single(), (req, res) => {
  res.json({ profilePic: req.file });
});

// URL upload
app.post("/profile/from-url", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, profileUploader.config);
    res.json({ profilePic: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
```

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

### Media Gallery (with URL import)

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
  urlUpload: {
    enabled: true,
    maxSizeMB: 100,
    allowedDomains: [
      "imgur.com",
      "giphy.com",
      "youtube.com",
    ],
  },
});

// Regular uploads
app.post("/gallery/upload", galleryUploader.multiple(), (req, res) => {
  res.json({
    uploaded: req.files,
    rejected: req.rejectedFiles || [],
  });
});

// Import from URL
app.post("/gallery/import", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, galleryUploader.config);
    res.json({ success: true, media: result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
```

---

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

---

## 🧪 Testing

### Regular File Uploads

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

### URL Uploads

```bash
# Download from URL
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://picsum.photos/800/600"}'

# Test domain validation
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://unsplash.com/photo.jpg"}'
```

---

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

After URL download, `downloadFromUrl` returns:

```javascript
{
  filename: 'photo-compressed.jpg',
  path: 'uploads/images/photo-compressed.jpg',
  size: 524288,
  mimetype: 'image/jpeg',
  originalUrl: 'https://example.com/photo.jpg',
  finalUrl: 'https://cdn.example.com/photo.jpg' // After redirects
}
```

---

## 🚨 Error Handling

```javascript
app.use((err, req, res, next) => {
  // URL upload errors
  if (err.code === "DOMAIN_BLOCKED") {
    return res.status(403).json({
      error: "Domain is blocked",
      domain: err.info.domain,
    });
  }

  if (err.code === "DOMAIN_NOT_ALLOWED") {
    return res.status(403).json({
      error: "Domain not allowed",
      allowedDomains: err.info.allowedDomains,
    });
  }

  // Regular upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large" });
  }

  if (err.message?.includes("File extension not allowed")) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  res.status(500).json({ error: "Upload failed" });
});
```

---

## 🔄 Automatic Cleanup

Files are automatically deleted when `cleanupOnError: true` (default) in these scenarios:

1. **Multer validation errors** (invalid extension, file too large)
2. **Custom validation errors** (size limits, domain restrictions)
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

---

## 📚 API Reference

### `createUploader(config: UploadConfig)`

Creates an uploader instance.

**Returns:**
- `single()` - Middleware for single file upload
- `multiple()` - Middleware for multiple file uploads
- `config` - The resolved configuration object

### `downloadFromUrl(url: string, config: UploadConfig)`

Downloads a file from URL with validation and processing.

**Parameters:**
- `url` - The URL to download from
- `config` - The uploader configuration object

**Returns:** `Promise<UrlDownloadResult>`

```typescript
interface UrlDownloadResult {
  filename: string;      // Final filename (may include -compressed suffix)
  path: string;          // Full path to downloaded file
  size: number;          // Final file size in bytes
  mimetype: string;      // MIME type from Content-Type header
  originalUrl: string;   // Original URL provided
  finalUrl: string;      // Final URL after redirects
}
```

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

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT © [Manan Patel](https://github.com/mananzealousweb)

---

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/upload-smith)
- [GitHub Repository](https://github.com/mananzealousweb/upload-smith)
- [Report Issues](https://github.com/mananzealousweb/upload-smith/issues)
- [Changelog](CHANGELOG.md)

---

## 🙏 Acknowledgments

Built on top of the excellent [Multer](https://github.com/expressjs/multer) library and [Sharp](https://github.com/lovell/sharp) for image processing.

Made with ❤️ by [Manan Patel](https://github.com/mananzealousweb)