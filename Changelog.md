# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**.

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

| Version | Release Date | Type  | Summary                  |
| ------- | ------------ | ----- | ------------------------ |
| 1.0.0   | 2025-01-XX   | Major | URL Upload Feature       |
| 0.2.0   | 2024-XX-XX   | Minor | Production Stabilization |
| 0.1.0   | 2024-XX-XX   | Minor | Initial Release          |

---

## Migration Guides

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

## Planned Features

- [ ] S3/Cloud storage integration
- [ ] Progress callbacks for large uploads

---

**Note:** This project follows [Semantic Versioning](https://semver.org/).
