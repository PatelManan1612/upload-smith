# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**.

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