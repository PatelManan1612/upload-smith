# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**.

---

## [2.1.0] – 🔐 Minor Release: FTP & SFTP Storage Support

🎉 **New feature addition: Native support for FTP and SFTP servers as storage providers**

### ✨ New Features

#### 📂 FTP & SFTP Support (NEW!)

Upload files directly to traditional FTP servers or secure SFTP servers with full configuration control.

**New Providers:**

- **SFTP** - SSH File Transfer Protocol (secure, key-based or password auth)
- **FTP** - File Transfer Protocol (standard or FTPS/TLS)

#### 🔧 SFTP Configuration

```typescript
cloudStorage: {
  enabled: true,
  provider: 'sftp',
  config: {
    host: string,
    port?: number,          // Default: 22
    username: string,
    password?: string,
    privateKey?: string,    // Support for RSA/PEM keys
    passphrase?: string,    // For encrypted keys
    remotePath: string,     // Remote directory path
    timeout?: number,       // Default: 30000ms
  }
}
```

#### 📡 FTP Configuration

```typescript
cloudStorage: {
  enabled: true,
  provider: 'ftp',
  config: {
    host: string,
    port?: number,          // Default: 21
    username: string,
    password: string,
    remotePath: string,
    secure?: boolean,       // Enable FTPS (TLS)
    passive?: boolean,      // Default: true
  }
}
```

### 🛠️ Technical Improvements

- Seamless integration with existing `createUploader` and `downloadFromUrl` flows.
- Automated folder creation on remote servers (v1.0.x style logic for FTP/SFTP).
- Robust error handling for connection timeouts and authentication failures.
- Full support for `keepLocalCopy` and `cleanupOnError` with FTP/SFTP.

---

## [2.0.0] – 🚀 Major Release: Cloud Storage Integration

🎉 **Major feature addition: Upload directly to AWS S3, Azure Blob Storage, Google Cloud Storage, and Cloudinary**

### ✨ New Features

#### ☁️ Cloud Storage Support (NEW!)

Upload files directly to cloud storage providers with optional local copy:

**Supported Providers:**

- **AWS S3** - Amazon Simple Storage Service
- **Azure Blob Storage** - Microsoft Azure cloud storage
- **Google Cloud Storage (GCS)** - Google Cloud Platform storage
- **Cloudinary** - Media management platform

#### 🔧 Cloud Storage Configuration

```typescript
cloudStorage: {
  enabled: true,                     // Enable cloud storage upload
  provider: 'aws' | 'azure' | 'gcs' | 'cloudinary',
  config: {
    // Provider-specific configuration
  },
  publicAccess?: boolean,            // Make files publicly accessible
  cdnUrl?: string,                   // Custom CDN URL
  folder?: string,                   // Cloud folder/prefix path
  metadata?: Record<string, string>, // Custom metadata tags
  keepLocalCopy?: boolean,           // Keep local copy after cloud upload (default: false)
  cleanupOnError?: boolean           // Auto-delete on upload failure (default: true)
}
```

#### 💾 Local Copy Behavior

By default, when cloud storage is enabled, files are **only** stored in the cloud:

- `keepLocalCopy: false` (default) - Files uploaded to cloud only, no local copy
- `keepLocalCopy: true` - Files uploaded to cloud AND saved locally

```typescript
// Cloud only (default)
cloudStorage: {
  enabled: true,
  provider: 'aws',
  config: { /* ... */ },
  // keepLocalCopy: false (default - no local copy)
}

// Cloud + Local copy
cloudStorage: {
  enabled: true,
  provider: 'aws',
  config: { /* ... */ },
  keepLocalCopy: true, // Keep local copy as well
}
```

#### 🌐 AWS S3 Integration

```typescript
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
    keepLocalCopy: false, // No local copy (default)
  },
});
```

#### 🔷 Azure Blob Storage Integration

```typescript
cloudStorage: {
  enabled: true,
  provider: 'azure',
  config: {
    accountName: 'mystorageaccount',
    accountKey: process.env.AZURE_STORAGE_KEY,
    containerName: 'uploads',
  },
  publicAccess: true,
  folder: 'images',
  keepLocalCopy: true, // Keep local copy as well
}
```

#### 🔵 Google Cloud Storage Integration

```typescript
cloudStorage: {
  enabled: true,
  provider: 'gcs',
  config: {
    projectId: 'my-project',
    bucketName: 'my-bucket',
    keyFilename: './gcs-credentials.json',
  },
  publicAccess: true,
  folder: 'uploads/images',
}
```

#### 🎨 Cloudinary Integration

```typescript
cloudStorage: {
  enabled: true,
  provider: 'cloudinary',
  config: {
    cloudName: 'my-cloud',
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  folder: 'uploads/images',
}
```

#### 🔒 Enhanced File Objects

When cloud storage is enabled, uploaded files include cloud metadata:

```typescript
// With keepLocalCopy: false (default)
{
  fieldname: 'file',
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 1048576,

  // ✨ Cloud storage info
  cloudUrl: 'https://s3.amazonaws.com/bucket/file.jpg',
  cloudPath: 'uploads/images/photo.jpg',
  publicUrl: 'https://bucket.s3.amazonaws.com/file.jpg',
  cdnUrl: 'https://cdn.example.com/file.jpg',
  cloudProvider: 'aws',
  cloudMetadata: {
    eTag: '"abc123"',
    versionId: 'xyz789'
  }
}

// With keepLocalCopy: true
{
  fieldname: 'file',
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  destination: 'uploads/images',    // Local path (when keepLocalCopy: true)
  filename: '1234567890-photo.jpg', // Local filename
  path: 'uploads/images/1234567890-photo.jpg', // Local path
  size: 1048576,

  // ✨ Cloud storage info
  cloudUrl: 'https://s3.amazonaws.com/bucket/file.jpg',
  cloudPath: 'uploads/images/photo.jpg',
  publicUrl: 'https://bucket.s3.amazonaws.com/file.jpg',
  cdnUrl: 'https://cdn.example.com/file.jpg',
  cloudProvider: 'aws',
  cloudMetadata: {
    eTag: '"abc123"',
    versionId: 'xyz789'
  }
}
```

#### 🧹 Automatic Cloud Cleanup

- Files are automatically deleted from cloud storage on errors
- Works with all supported providers
- Configurable via `cleanupOnError` option
- Cleanup on validation failures, controller errors, or exceptions
- Local files cleaned up when `keepLocalCopy: true`

#### 🎯 Usage Examples

**Cloud Only (Default):**

```typescript
import { createUploader } from "upload-smith";

const uploader = createUploader({
  fieldName: "avatar",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true,
  imageQuality: 85,
  sizeConfig: {
    defaultMB: 5,
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
    folder: "avatars",
    // keepLocalCopy: false (default - no local storage)
  },
});

app.post("/upload-avatar", uploader.single(), (req, res) => {
  res.json({
    // Cloud URLs only
    cloudUrl: req.file.cloudUrl,
    publicUrl: req.file.publicUrl,
  });
});
```

**Cloud + Local Copy:**

```typescript
const uploader = createUploader({
  fieldName: "documents",
  allowedExtensions: ["pdf", "docx"],
  folderConfig: {
    basePath: "uploads/documents", // Used when keepLocalCopy: true
  },
  cloudStorage: {
    enabled: true,
    provider: "aws",
    config: {
      /* ... */
    },
    folder: "documents",
    keepLocalCopy: true, // Keep local copy as well
  },
});

app.post("/upload", uploader.single(), (req, res) => {
  res.json({
    // Both local and cloud info available
    localPath: req.file.path,
    cloudUrl: req.file.cloudUrl,
    publicUrl: req.file.publicUrl,
  });
});
```

**Local Only (No Cloud):**

```typescript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png"],
  folderConfig: {
    basePath: "uploads",
    byExtension: true,
  },
  // No cloudStorage config - works as before
});

app.post("/upload", uploader.single(), (req, res) => {
  res.json({
    // Local file info only
    path: req.file.path,
    filename: req.file.filename,
  });
});
```

### 🛠️ Technical Improvements

- Direct streaming to cloud storage for memory efficiency
- Optional local copy with `keepLocalCopy` flag
- Provider-specific error handling
- Automatic retry logic for failed cloud uploads
- Unified interface across all cloud providers
- Efficient cleanup of both cloud and local files on errors

### 📚 Documentation

- Complete cloud storage setup guides for all providers
- Provider-specific configuration examples
- Local copy behavior documentation
- Environment variable best practices
- Error handling for cloud operations

### 🔄 Breaking Changes

**None!** This is a pure feature addition with full backward compatibility.

- Existing code without `cloudStorage` config continues to work exactly as before
- All local storage features remain unchanged
- No configuration changes required for existing users
- `folderConfig` still works when using local storage or `keepLocalCopy: true`

### 🐛 Bug Fixes

- Improved error handling for network failures
- Better cleanup on partial upload failures
- Fixed potential race conditions in file cleanup

---

## [1.0.0] – 🚀 Major Release: URL Upload Feature

🎉 **Major feature addition: Download and process files from URLs**

### ✨ New Features

#### 📥 URL Upload Support

- **Download files directly from URLs** with full validation and processing
- Automatic file download with configurable timeout and redirect handling
- Support for both HTTP and HTTPS protocols
- Smart filename extraction and sanitization from URLs
- Mirrors all existing upload features: compression, size limits, extension validation

#### 🔒 Advanced Domain Control

- **Whitelist support** (`allowedDomains`) - Only allow downloads from trusted domains
- **Blacklist support** (`blockedDomains`) - Block specific domains from downloads
- **Priority-based validation** - Blacklist checked before whitelist
- Subdomain matching support (e.g., `imgur.com` allows `i.imgur.com`)
- Works with redirects - validates all URLs in redirect chain

#### 🛡️ URL Upload Security & Validation

- Protocol validation (only HTTP/HTTPS allowed)
- Domain validation against whitelist/blacklist
- File extension validation (same as regular uploads)
- Size limit enforcement during download (prevents large file attacks)
- Configurable maximum redirects to prevent redirect loops
- Custom User-Agent and headers support

#### ⚙️ URL Upload Configuration

```typescript
urlUpload: {
  enabled: boolean,              // Enable/disable URL uploads
  maxSizeMB?: number,            // Max download size in MB
  timeout?: number,              // Request timeout in milliseconds
  allowedDomains?: string[],     // Whitelist of allowed domains
  blockedDomains?: string[],     // Blacklist of blocked domains
  maxRedirects?: number,         // Maximum redirect follow count
  followRedirects?: boolean,     // Enable/disable redirect following
  userAgent?: string,            // Custom User-Agent header
  headers?: Record<string, string> // Custom HTTP headers
}
```

#### 🖼️ Image Compression for URL Downloads

- Automatic image compression for downloaded images
- Uses the same `compressImage` and `imageQuality` settings as regular uploads
- Supports all image formats: jpg, jpeg, png, webp, tiff, gif
- Seamless integration with existing compression pipeline

#### 📊 Enhanced Error Handling

- New `DomainBlockedError` for blacklisted domains
- New `DomainNotAllowedError` for non-whitelisted domains
- New `InvalidUrlError` for malformed URLs
- New `TooManyRedirectsError` for redirect loops
- New `UploadTimeoutError` for timeout failures
- New `HttpError` for non-200 HTTP responses
- All errors include detailed `info` object with context

### 🎯 Usage Example

```typescript
import { createUploader, downloadFromUrl } from "upload-smith";

const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "webp"],
  compressImage: true,
  imageQuality: 80,
  sizeConfig: {
    defaultMB: 15,
  },
  folderConfig: {
    basePath: "uploads/images",
  },
  urlUpload: {
    enabled: true,
    maxSizeMB: 20,
    timeout: 30000,
    allowedDomains: ["picsum.photos", "imgur.com", "via.placeholder.com"],
    blockedDomains: ["malicious.com", "spam-site.net"],
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

### 🔧 API Changes

#### New Exports

- `downloadFromUrl(url: string, config: UploadConfig): Promise<UrlDownloadResult>`
  - Downloads file from URL with full validation
  - Returns file metadata including path, size, mimetype

#### New Types

- `UrlUploadConfig` - Configuration interface for URL uploads
- `UrlDownloadResult` - Return type for `downloadFromUrl`

#### Updated Types

- `UploadConfig` now includes optional `urlUpload?: UrlUploadConfig`

### 🛠️ Technical Improvements

- Native HTTP/HTTPS client implementation (no external dependencies for downloads)
- Streaming download with real-time size validation
- Memory-efficient file writing
- Automatic cleanup on download failures
- Respects all existing uploader configurations

### 📚 Documentation

- Comprehensive URL upload documentation in README
- Domain whitelist/blacklist usage examples
- Complete testing guide with curl examples
- Error handling reference for URL uploads

### 🔄 Breaking Changes

None - this is a pure feature addition with backward compatibility

### 🐛 Bug Fixes

- Fixed issue where compression was not applied to URL-downloaded images
- Improved error messages for domain validation failures

---

## [0.2.0] – Production Stabilization & Bug Fixes

✅ **Production-ready release with robustness improvements**

### 🛠️ Bug Fixes

- Fixed issue where **image compression was applied to non-image files**
- Prevented Sharp from attempting to process unsupported formats (pdf, zip, etc.)
- Corrected Multer error mapping:
  - Properly detect `TooManyFilesError` instead of `InvalidFieldNameError`
- Ensured temporary files are always deleted on validation failures
- Fixed edge cases where rejected files were not cleaned during partial uploads

### 🔥 Error Handling Improvements

- Introduced **fail-fast configuration validation**
- Added `InvalidConfigurationError` for:
  - Conflicting flags (`partialUpload` without `multiple`)
  - Invalid size configurations
  - Invalid folder configuration combinations
- Normalized Multer error translation into domain-specific errors
- Improved error payloads with contextual `info` fields

### 🧠 Behavioral Fixes

- Ensured `partialUpload` only works when `multiple: true`
- Ensured `maxFiles` is enforced consistently
- Guaranteed no files are written if configuration is invalid
- Ensured cleanup also runs when controllers send error responses

### 📚 Documentation Enhancements

- Comprehensive README with:
  - Full configuration reference
  - Real-world usage examples
  - Error handling guidance
  - TypeScript augmentation examples
- Added clear explanation of fail-fast configuration behavior
- Improved testing instructions and curl examples

### 🧩 Developer Experience

- Separated configuration validation into a dedicated validator
- Improved naming clarity to avoid flag/function collisions
- Added clear guarantees and non-goals for the package
- Prepared project for long-term maintenance

---

## [0.1.0] – Initial Development Release

🚧 **First usable development version of Upload Smith**

### ✨ Core Features

- Config-driven file uploader built on top of Multer
- Support for both **single** and **multiple** file uploads
- Full **TypeScript support** with bundled type definitions
- Works with both **ESM and CommonJS**
- Clean, middleware-based API for Express.js

### 🔒 File Validation

- Allowed file validation using **extension-based allowlist**
- Reject unsupported file types with structured errors
- Custom filename generation via user-defined callback

### 📏 File Size Management

- Global file size limit support
- Per-extension size limits (e.g. larger PDFs, smaller images)
- Intelligent size resolution with fallback defaults

### 📁 Folder Organization

- Auto-creation of upload directories
- Organize uploads:
  - By extension (`/uploads/jpg`, `/uploads/pdf`)
  - By custom category mapping (`/uploads/images`, `/uploads/documents`)
  - Combined category + extension structure
- Configurable base upload path

### 🖼️ Image Processing

- Optional image compression using Sharp
- Configurable image quality (1–100)
- Safe handling of image formats (jpg, jpeg, png, webp, gif, tiff)

### 🧹 Cleanup & Safety

- Automatic cleanup on:
  - Multer errors
  - Validation errors
  - Controller errors (HTTP status ≥ 400)
- Prevents orphaned or partially uploaded files

### 🧪 Developer Experience

- Clear and structured error classes
- Express request augmentation (`req.rejectedFiles`)
- Easy testing via curl or Postman
- Sensible defaults with override support

---

## Version History

| Version | Release Date | Type  | Summary                   |
| ------- | ------------ | ----- | ------------------------- |
| 2.1.0   | 2026-03-17   | Minor | FTP & SFTP Storage Support|
| 2.0.0   | 2025-02-XX   | Major | Cloud Storage Integration |
| 1.0.0   | 2025-01-XX   | Major | URL Upload Feature        |
| 0.2.0   | 2024-XX-XX   | Minor | Production Stabilization  |
| 0.1.0   | 2024-XX-XX   | Minor | Initial Release           |

---

## Migration Guides

### Upgrading to 2.0.0 from 1.x

**Good news: No breaking changes!** This is a pure feature addition.

Your existing code will continue to work without modifications. The cloud storage feature is **optional** and can be enabled when you're ready.

#### Storage Modes in v2.0.0:

1. **Local Only (default, as before)**

   ```typescript
   const uploader = createUploader({
     fieldName: "file",
     folderConfig: { basePath: "uploads" },
     // No cloud config - works exactly as before
   });
   ```

2. **Cloud Only (new)**

   ```typescript
   const uploader = createUploader({
     fieldName: "file",
     cloudStorage: {
       enabled: true,
       provider: "aws",
       config: {
         /* ... */
       },
       // keepLocalCopy: false (default - cloud only)
     },
   });
   ```

3. **Cloud + Local Copy (new)**
   ```typescript
   const uploader = createUploader({
     fieldName: "file",
     folderConfig: { basePath: "uploads" }, // For local copy
     cloudStorage: {
       enabled: true,
       provider: "aws",
       config: {
         /* ... */
       },
       keepLocalCopy: true, // Saves to both cloud and local
     },
   });
   ```

#### To Use Cloud Storage:

1. **Add Cloud Storage Configuration**:

```typescript
const uploader = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png"],

  // Optional: Keep local copy
  folderConfig: {
    basePath: "uploads",
  },

  // NEW: Cloud storage
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
    publicAccess: true,
    keepLocalCopy: false, // true to keep local copy
  },
});
```

2. **Access Cloud URLs**:

```typescript
app.post("/upload", uploader.single(), (req, res) => {
  res.json({
    cloudUrl: req.file.cloudUrl,
    publicUrl: req.file.publicUrl,
    // If keepLocalCopy: true, also has:
    // localPath: req.file.path
  });
});
```

That's it! No other changes needed.

### Upgrading to 1.0.0 from 0.x

**Good news: No breaking changes!** This is a pure feature addition.

Your existing code will continue to work without modifications. To use the new URL upload feature:

1. Update your config to include `urlUpload`:

```typescript
const uploader = createUploader({
  // ... your existing config
  urlUpload: {
    enabled: true,
    maxSizeMB: 20,
    allowedDomains: ["trusted-domain.com"],
  },
});
```

2. Use the new `downloadFromUrl` function:

```typescript
import { downloadFromUrl } from "upload-smith";

const result = await downloadFromUrl(url, uploader.config);
```

That's it! No other changes needed.

---

## Stay tuned for future updates.

**Note:** This project follows [Semantic Versioning](https://semver.org/).
