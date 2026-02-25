# Upload Smith

**A powerful, config-driven file upload utility for Express.js with support for AWS S3, Azure Blob Storage, Google Cloud Storage, and Cloudinary.**

[![npm version](https://img.shields.io/npm/v/upload-smith.svg)](https://www.npmjs.com/package/upload-smith)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Simple Configuration** - One config object for all upload settings
- ☁️ **Cloud Storage** - Upload to AWS S3, Azure Blob, GCS, or Cloudinary
- 💾 **Flexible Storage** - Cloud only, local only, or both with `keepLocalCopy`
- 📥 **URL Download Support** - Download and process files from URLs
- 🔒 **Domain Control** - Whitelist/blacklist domains for URL uploads
- 📁 **Smart Folder Organization** - Organize by extension or custom categories
- 🔐 **Extension Validation** - Whitelist allowed file types
- 📏 **Per-Extension Size Limits** - Different size limits for different file types
- 🖼️ **Automatic Image Compression** - Compress images on upload with quality control
- 🧹 **Automatic Cleanup** - Delete files on errors (local and cloud)
- 🔄 **Partial Uploads** - Save valid files even when some fail validation
- 📝 **Custom Filenames** - Full control over file naming
- 💪 **TypeScript Support** - Full type definitions included
- 📦 **Dual Package** - Works with both ESM and CommonJS

## 📦 Installation

```bash
npm install upload-smith
```

## 🚀 Quick Start

### Local Storage (Default)

```javascript
import express from "express";
import { createUploader } from "upload-smith";

const app = express();

const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 5,
  },
  folderConfig: {
    basePath: "uploads",
  },
});

app.post("/upload", uploader.single(), (req, res) => {
  res.json({ 
    path: req.file.path,
    filename: req.file.filename,
  });
});

app.listen(3000);
```

### Cloud Storage Only

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 10,
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    publicAccess: true,
    folder: "uploads",
    keepLocalCopy: false, // Default - no local copy
  },
});

app.post("/upload", uploader.single(), (req, res) => {
  res.json({
    cloudUrl: req.file.cloudUrl,
    publicUrl: req.file.publicUrl,
  });
});
```

### Cloud Storage + Local Copy

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  folderConfig: {
    basePath: "uploads", // For local copy
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    folder: "uploads",
    keepLocalCopy: true, // Keep local copy as well
  },
});

app.post("/upload", uploader.single(), (req, res) => {
  res.json({
    // Local file info
    localPath: req.file.path,
    filename: req.file.filename,
    // Cloud file info
    cloudUrl: req.file.cloudUrl,
    publicUrl: req.file.publicUrl,
  });
});
```

## 📖 Documentation

### Table of Contents
- [Storage Modes](#storage-modes)
- [Cloud Storage Configuration](#cloud-storage-configuration)
- [AWS S3 Setup](#aws-s3-setup)
- [Azure Blob Storage Setup](#azure-blob-storage-setup)
- [Google Cloud Storage Setup](#google-cloud-storage-setup)
- [Cloudinary Setup](#cloudinary-setup)
- [URL Upload Feature](#url-upload-feature)
- [Per-Extension Size Limits](#per-extension-size-limits)
- [Image Compression](#image-compression)
- [Folder Organization](#folder-organization)
- [Custom Filenames](#custom-filenames)
- [Multiple Files](#multiple-files)
- [Partial Uploads](#partial-uploads)
- [Complete Configuration Options](#-complete-configuration-options)
- [Error Types Reference](#-error-types-reference)
- [Real-World Examples](#-real-world-examples)

---

## Storage Modes

Upload Smith supports three storage modes:

### 1. Local Only (Default)

Files saved to local disk only. No cloud configuration needed.

```javascript
const uploader = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "uploads",
  },
  // No cloudStorage config
});
```

**Use case:** Development, simple applications, no cloud infrastructure needed.

### 2. Cloud Only

Files uploaded directly to cloud storage. No local disk usage.

```javascript
const uploader = createUploader({
  fieldName: "file",
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
    keepLocalCopy: false, // Default - no local copy
  },
});
```

**Use case:** Production apps, scalable storage, CDN delivery, serverless deployments.

### 3. Cloud + Local Copy

Files uploaded to cloud AND saved locally.

```javascript
const uploader = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "uploads", // For local copy
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
    keepLocalCopy: true, // Keep local copy
  },
});
```

**Use case:** Backup strategy, migration period, hybrid deployments.

---

## Cloud Storage Configuration

### Common Configuration

```javascript
cloudStorage: {
  enabled: true,                    // Enable cloud storage
  provider: 'aws' | 'azure' | 'gcs' | 'cloudinary', // Choose provider
  config: { /* provider-specific */ },
  publicAccess?: boolean,           // Make files publicly accessible (default: false)
  folder?: string,                  // Cloud folder/prefix path
  cdnUrl?: string,                  // Custom CDN URL
  metadata?: Record<string, string>, // Custom metadata tags
  keepLocalCopy?: boolean,          // Keep local copy after cloud upload (default: false)
  cleanupOnError?: boolean          // Auto-delete on failure (default: true)
}
```

### `keepLocalCopy` Behavior

| `keepLocalCopy` | Local Disk | Cloud Storage | Use Case |
|-----------------|------------|---------------|----------|
| `false` (default) | ❌ No | ✅ Yes | Production, scalable apps |
| `true` | ✅ Yes | ✅ Yes | Backup, migration, hybrid |
| Not configured | ✅ Yes | ❌ No | Development, simple apps |

---

## AWS S3 Setup

### Configuration

```javascript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      region: "us-east-1",
      bucket: "my-bucket",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    publicAccess: true,
    folder: "uploads/images",
    keepLocalCopy: false, // Cloud only
  },
});
```

### Environment Variables

```bash
AWS_REGION=us-east-1
AWS_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## Azure Blob Storage Setup

### Configuration

```javascript
const uploader = createUploader({
  fieldName: "file",
  cloudStorage: {
    enabled: true,
    provider: "azure",
    config: {
      accountName: "mystorageaccount",
      accountKey: process.env.AZURE_ACCOUNT_KEY,
      containerName: "uploads",
      // Optional: use connection string instead
      // connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    },
    publicAccess: true,
    folder: "documents",
    keepLocalCopy: false,
  },
});
```

### Environment Variables

```bash
AZURE_ACCOUNT_NAME=mystorageaccount
AZURE_ACCOUNT_KEY=your-account-key-here
# Or use connection string
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

---

## Google Cloud Storage Setup

### Configuration

```javascript
const uploader = createUploader({
  fieldName: "file",
  cloudStorage: {
    enabled: true,
    provider: "gcs",
    config: {
      projectId: "my-project-id",
      bucketName: "my-bucket",
      keyFilename: "./gcs-credentials.json",
      // Or use credentials object
      // credentials: {
      //   client_email: process.env.GCS_CLIENT_EMAIL,
      //   private_key: process.env.GCS_PRIVATE_KEY,
      // },
    },
    publicAccess: true,
    folder: "uploads",
    keepLocalCopy: false,
  },
});
```

### Environment Variables

```bash
GCP_PROJECT_ID=my-project-id
GCS_BUCKET_NAME=my-bucket
GCS_KEY_FILENAME=./gcs-credentials.json
```

### Service Account Permissions

The service account needs these roles:
- `Storage Object Creator`
- `Storage Object Viewer`
- `Storage Object Admin` (for deletion)

---

## Cloudinary Setup

### Configuration

```javascript
const uploader = createUploader({
  fieldName: "file",
  cloudStorage: {
    enabled: true,
    provider: "cloudinary",
    config: {
      cloudName: "my-cloud",
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    folder: "product-images",
    keepLocalCopy: false,
  },
});
```

### Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=my-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

---

## URL Upload Feature

Download files from URLs with optional cloud storage:

```javascript
import { createUploader, downloadFromUrl } from "upload-smith";

const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true,
  imageQuality: 80,
  folderConfig: {
    basePath: "uploads", // For local or keepLocalCopy
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    folder: "url-imports",
    keepLocalCopy: false, // Cloud only
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 20,
    allowedDomains: ["imgur.com", "picsum.photos"],
  },
});

app.post("/import-from-url", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, uploader.config);
    res.json({
      success: true,
      cloudUrl: result.cloudUrl,
      publicUrl: result.publicUrl,
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
urlUpload: {
  enabled: true,
  allowedDomains: [
    "imgur.com",        // Allows imgur.com and i.imgur.com
    "picsum.photos",    // Allows picsum.photos
    "unsplash.com",     // Allows unsplash.com and images.unsplash.com
  ],
}

// ✅ Allowed: https://i.imgur.com/abc123.jpg
// ✅ Allowed: https://picsum.photos/200/300
// ❌ Blocked: https://malicious-site.com/image.jpg (not in whitelist)
```

### Domain Blacklist (Block Specific Domains)

```javascript
urlUpload: {
  enabled: true,
  blockedDomains: [
    "malicious.com",
    "spam-site.net",
    "untrusted.org",
  ],
  // No allowedDomains = allow all EXCEPT blocked ones
}

// ✅ Allowed: https://imgur.com/abc123.jpg
// ✅ Allowed: https://any-other-site.com/image.png
// ❌ Blocked: https://malicious.com/image.jpg
```

### Combined Whitelist + Blacklist

```javascript
urlUpload: {
  enabled: true,
  allowedDomains: [
    "imgur.com",
    "picsum.photos",
    "cdn.example.com",
  ],
  blockedDomains: [
    "spam.cdn.example.com", // Block specific subdomain
  ],
}

// Blacklist checked FIRST, then whitelist
// ✅ Allowed: https://imgur.com/image.jpg (whitelisted, not blacklisted)
// ✅ Allowed: https://cdn.example.com/file.png (whitelisted, not blacklisted)
// ❌ Blocked: https://spam.cdn.example.com/bad.jpg (blacklisted)
// ❌ Blocked: https://unsplash.com/photo.jpg (not whitelisted)
```

### Advanced URL Upload Configuration

```javascript
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
  allowedDomains: ["trusted-cdn.com"],
  blockedDomains: ["banned-site.com"],
}
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
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
  },
});
```

---

## Image Compression

Compress images before uploading (works for both local and cloud storage):

```javascript
const uploader = createUploader({
  fieldName: "photos",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true, // Enable compression
  imageQuality: 80,    // 80% quality (1-100)
  sizeConfig: {
    defaultMB: 10,
  },
  cloudStorage: {
    enabled: true,
    provider: "cloudinary",
    config: { /* ... */ },
  },
});
```

**Note:** Compression works for both regular uploads AND URL downloads. Only actual image files (jpg, jpeg, png, webp, gif, tiff) are compressed.

---

## Folder Organization

**Local Storage - By Extension:**

```javascript
const uploader = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "uploads",
    byExtension: true, // Creates: uploads/jpg, uploads/pdf, etc.
  },
});
```

**Local Storage - By Category:**

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

**Local Storage - Combined (Category + Extension):**

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

**Note:** `folderConfig` is used for local storage or when `keepLocalCopy: true`. For cloud storage path, use `cloudStorage.folder`.

---

## Custom Filenames

```javascript
const uploader = createUploader({
  fieldName: "avatar",
  filename: (req, file) => {
    const userId = req.user.id; // From auth middleware
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    return `user-${userId}-${timestamp}${ext}`;
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
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
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
  },
});

app.post("/upload-multiple", uploader.multiple(), (req, res) => {
  res.json({
    files: req.files.map(f => ({
      cloudUrl: f.cloudUrl,
      publicUrl: f.publicUrl,
    })),
  });
});
```

---

## Partial Uploads

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
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: { /* ... */ },
  },
});

app.post("/upload", uploader.multiple(), (req, res) => {
  const uploaded = req.files;
  const rejected = req.rejectedFiles || [];

  res.json({
    uploaded: uploaded.map(f => ({
      name: f.originalname,
      cloudUrl: f.cloudUrl,
    })),
    rejected: rejected.map(r => ({
      name: r.originalname,
      reason: r.reason,
    })),
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

  // ==================== CLOUD STORAGE (OPTIONAL) ====================
  cloudStorage?: {
    enabled: true,
    provider: 'aws' | 'azure' | 'gcs' | 'cloudinary',
    
    // AWS S3 Config
    config: {
      region: string,
      bucket: string,
      accessKeyId: string,
      secretAccessKey: string,
    },
    
    // Azure Blob Config
    config: {
      accountName: string,
      accountKey: string,
      containerName: string,
      // Or: connectionString: string,
    },
    
    // GCS Config
    config: {
      projectId: string,
      bucketName: string,
      keyFilename: string,
      // Or: credentials: {...},
    },
    
    // Cloudinary Config
    config: {
      cloudName: string,
      apiKey: string,
      apiSecret: string,
    },
    
    publicAccess?: boolean,         // Make files public (default: false)
    folder?: string,                // Cloud folder path
    cdnUrl?: string,                // Custom CDN URL
    metadata?: Record<string, string>, // Custom metadata
    keepLocalCopy?: boolean,        // Keep local copy (default: false)
    cleanupOnError?: boolean,       // Auto-delete on error (default: true)
  },

  // ==================== FILE VALIDATION ====================
  allowedExtensions?: string[],

  // ==================== SIZE LIMITS ====================
  sizeConfig?: {
    enabled?: boolean,
    defaultMB?: number,
    perExtensionMB?: {
      [ext: string]: number
    }
  },

  // ==================== URL UPLOAD ====================
  urlUpload?: {
    enabled: boolean,
    maxSizeMB?: number,
    timeout?: number,
    allowedDomains?: string[],
    blockedDomains?: string[],
    maxRedirects?: number,
    followRedirects?: boolean,
    userAgent?: string,
    headers?: Record<string, string>
  },

  // ==================== FILENAME ====================
  filename?: (req, file) => string,

  // ==================== MULTIPLE FILES ====================
  multiple?: boolean,
  maxFiles?: number,

  // ==================== FOLDER ORGANIZATION (LOCAL STORAGE) ====================
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
  cleanupOnError?: boolean,

  // ==================== PARTIAL UPLOADS ====================
  partialUpload?: boolean,

  // ==================== IMAGE COMPRESSION ====================
  compressImage?: boolean,
  imageQuality?: number, // 1-100
});
```

---

## 📊 File Object Structure

### With Cloud Storage Only (`keepLocalCopy: false`)

```javascript
{
  fieldname: 'file',
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 524288,
  
  // Cloud storage info
  cloudUrl: 'https://s3.amazonaws.com/bucket/uploads/photo.jpg',
  cloudPath: 'uploads/photo.jpg',
  publicUrl: 'https://my-bucket.s3.amazonaws.com/uploads/photo.jpg',
  cdnUrl: 'https://cdn.example.com/uploads/photo.jpg',
  cloudProvider: 'aws',
  cloudMetadata: {
    eTag: '"abc123"',
    versionId: 'xyz789'
  }
}
```

### With Cloud Storage + Local Copy (`keepLocalCopy: true`)

```javascript
{
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/images',    // Local path
  filename: '1234567890-photo.jpg',
  path: 'uploads/images/1234567890-photo.jpg', // Local path
  size: 524288,
  
  // Cloud storage info
  cloudUrl: 'https://s3.amazonaws.com/bucket/uploads/photo.jpg',
  cloudPath: 'uploads/photo.jpg',
  publicUrl: 'https://my-bucket.s3.amazonaws.com/uploads/photo.jpg',
  cdnUrl: 'https://cdn.example.com/uploads/photo.jpg',
  cloudProvider: 'aws',
  cloudMetadata: {
    eTag: '"abc123"',
    versionId: 'xyz789'
  }
}
```

### Local Storage Only (No Cloud)

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

---

## 🚨 Error Types Reference

### Cloud Storage Errors

| Error | Code | Status | When it occurs |
|-------|------|--------|----------------|
| `CloudUploadError` | `CLOUD_UPLOAD_ERROR` | 500 | Cloud upload failed |
| `CloudDeleteError` | `CLOUD_DELETE_ERROR` | 500 | Cloud deletion failed |
| `InvalidCloudConfigError` | `INVALID_CLOUD_CONFIG` | 500 | Invalid cloud configuration |

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

### Profile Picture Upload (Cloud Only)

```javascript
const profileUploader = createUploader({
  fieldName: "profilePic",
  allowedExtensions: ["jpg", "jpeg", "png"],
  sizeConfig: { defaultMB: 5 },
  compressImage: true,
  imageQuality: 85,
  cloudStorage: {
    enabled: true,
    provider: "cloudinary",
    config: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    folder: "profile-pictures",
    keepLocalCopy: false, // Cloud only
  },
});

app.post("/profile/upload", profileUploader.single(), (req, res) => {
  res.json({ 
    profilePicUrl: req.file.publicUrl,
    cdnUrl: req.file.cdnUrl,
  });
});
```

### Document Management System (Cloud + Local Backup)

```javascript
const documentUploader = createUploader({
  fieldName: "documents",
  allowedExtensions: ["pdf", "docx", "xlsx"],
  multiple: true,
  maxFiles: 20,
  partialUpload: true,
  sizeConfig: {
    enabled: true,
    perExtensionMB: {
      pdf: 25,
      docx: 20,
      xlsx: 15,
    },
  },
  folderConfig: {
    basePath: "uploads/documents", // For local backup
    byExtension: true,
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    folder: "documents",
    keepLocalCopy: true, // Keep local backup
    metadata: {
      department: "legal",
    },
  },
});

app.post("/documents/upload", documentUploader.multiple(), (req, res) => {
  res.json({
    uploaded: req.files.map(f => ({
      name: f.originalname,
      cloudUrl: f.cloudUrl,
      localPath: f.path, // Available because keepLocalCopy: true
    })),
    rejected: req.rejectedFiles || [],
  });
});
```

### Media Gallery (Cloud with URL Import)

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
  cloudStorage: {
    enabled: true,
    provider: "gcs",
    config: {
      projectId: process.env.GCP_PROJECT_ID,
      bucketName: process.env.GCS_BUCKET_NAME,
      keyFilename: "./gcs-credentials.json",
    },
    publicAccess: true,
    folder: "gallery",
    keepLocalCopy: false, // Cloud only
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 100,
    allowedDomains: [
      "imgur.com",
      "giphy.com",
    ],
  },
});

// Regular upload
app.post("/gallery/upload", galleryUploader.multiple(), (req, res) => {
  res.json({
    uploaded: req.files.map(f => ({
      url: f.publicUrl,
      type: f.mimetype,
    })),
  });
});

// Import from URL
app.post("/gallery/import", async (req, res) => {
  try {
    const result = await downloadFromUrl(req.body.url, galleryUploader.config);
    res.json({ 
      success: true, 
      url: result.publicUrl,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
```

### Simple Local Storage (No Cloud)

```javascript
const simpleUploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  sizeConfig: {
    defaultMB: 10,
  },
  folderConfig: {
    basePath: "uploads",
    byExtension: true,
  },
  // No cloudStorage config - works exactly as before
});

app.post("/upload", simpleUploader.single(), (req, res) => {
  res.json({
    path: req.file.path,
    filename: req.file.filename,
  });
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
curl -X POST http://localhost:3000/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://picsum.photos/800/600"}'

# Test domain validation
curl -X POST http://localhost:3000/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://unsplash.com/photo.jpg"}'
```

---

## 🚨 Error Handling

```javascript
app.use((err, req, res, next) => {
  // Cloud upload errors
  if (err.code === "CLOUD_UPLOAD_ERROR") {
    return res.status(500).json({
      error: "Cloud upload failed",
      provider: err.info.provider,
    });
  }

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

  // File validation errors
  if (err.code === "FILE_SIZE_EXCEEDED") {
    return res.status(413).json({
      error: "File too large",
      maxSize: err.info.maxSizeMB + "MB",
    });
  }

  if (err.code === "INVALID_FILE_EXTENSION") {
    return res.status(400).json({
      error: "Invalid file type",
      allowed: err.info.allowedExtensions,
    });
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
4. **Cloud upload failures** (both cloud and local files cleaned)

```javascript
app.post("/upload", uploader.single(), (req, res) => {
  // If this returns error status, files are auto-deleted
  if (!processFile(req.file)) {
    return res.status(400).json({ error: "Processing failed" });
  }

  res.json({ success: true });
});
```

**Cleanup behavior:**
- `keepLocalCopy: false` → Only cloud file deleted on error
- `keepLocalCopy: true` → Both cloud and local files deleted on error
- No cloud storage → Only local file deleted on error

---

## 📚 API Reference

### `createUploader(config: UploadConfig)`

Creates an uploader instance.

**Returns:**
- `single()` - Middleware for single file upload
- `multiple()` - Middleware for multiple file uploads
- `config` - The resolved configuration object
- `cloudStorage` - Cloud storage service instance (if enabled)

### `downloadFromUrl(url: string, config: UploadConfig)`

Downloads a file from URL with validation and processing.

**Parameters:**
- `url` - The URL to download from
- `config` - The uploader configuration object

**Returns:** `Promise<UrlDownloadResult>`

```typescript
interface UrlDownloadResult {
  filename: string;
  size: number;
  mimetype: string;
  originalUrl: string;
  finalUrl: string;
  
  // If keepLocalCopy: true or no cloud storage
  path?: string;
  
  // If cloud storage enabled
  cloudUrl?: string;
  publicUrl?: string;
  cloudPath?: string;
  cloudProvider?: string;
  cloudMetadata?: any;
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

MIT © [Manan Patel](https://github.com/PatelManan1612/upload-smith)

---

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/upload-smith)
- [GitHub Repository](https://github.com/PatelManan1612/upload-smith)
- [Changelog](CHANGELOG.md)

---

## 🙏 Acknowledgments

Built on top of the excellent [Multer](https://github.com/expressjs/multer) library and [Sharp](https://github.com/lovell/sharp) for image processing. Cloud storage powered by official SDKs from AWS, Azure, Google Cloud, and Cloudinary.

Made with ❤️ by [Manan Patel](https://github.com/PatelManan1612/upload-smith)