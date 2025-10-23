# Security Recommendations for Profile Picture Uploads

## ✅ Currently Implemented

1. **File Size Limit**: Max 5MB to prevent DoS attacks
2. **MIME Type Validation**: Checks Content-Type header
3. **File Extension Validation**: Allows only .jpg, .jpeg, .png, .gif, .webp
4. **Magic Number Verification**: Validates actual file signature (first bytes)
5. **Authentication Required**: Only logged-in users can upload
6. **User Isolation**: Users can only upload to their own profile
7. **Automatic Cleanup**: Old profile pictures are deleted when new ones are uploaded
8. **Error Handling**: Failed uploads are cleaned up immediately

## ⚠️ Additional Recommended Layers

### 1. Image Re-encoding (CRITICAL)
**Why**: Even valid images can contain malicious EXIF data or embedded scripts
**Solution**: Use `sharp` library to re-encode images, stripping metadata

```bash
npm install sharp
```

```javascript
import sharp from 'sharp';

// In uploadProfilePicture controller:
const processedImagePath = path.join(__dirname, '../uploads/profiles', `processed_${req.file.filename}`);
await sharp(req.file.path)
  .resize(500, 500, { fit: 'cover' }) // Resize to standard size
  .jpeg({ quality: 90 }) // Re-encode as JPEG
  .toFile(processedImagePath);

// Delete original, use processed
fs.unlinkSync(req.file.path);
```

### 2. Content Security Policy (CSP)
**Why**: Prevents uploaded images from executing scripts
**Solution**: Add CSP headers

```javascript
// In server.js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: http://localhost:5000; script-src 'self'"
  );
  next();
});
```

### 3. Separate Domain for User Content
**Why**: Isolates user-uploaded content from main application
**Solution**: Serve uploads from different subdomain (e.g., `cdn.phishnclick.com`)

### 4. Virus Scanning (Production)
**Why**: Detect known malware signatures
**Solution**: Use ClamAV or cloud service (AWS GuardDuty, VirusTotal API)

```javascript
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init();
const { isInfected } = await clamscan.scanFile(req.file.path);
if (isInfected) {
  fs.unlinkSync(req.file.path);
  return res.status(400).json({ error: "Malware detected" });
}
```

### 5. Rate Limiting
**Why**: Prevent abuse and DoS attacks
**Solution**: Use `express-rate-limit`

```javascript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 uploads per 15 minutes
  message: 'Too many upload attempts, please try again later'
});

router.post("/profile/picture", verifyToken, uploadLimiter, upload.single('profilePicture'), uploadProfilePicture);
```

### 6. Filename Sanitization (Already Done ✅)
**Why**: Prevent path traversal attacks
**Current**: Using timestamp + random number, ignoring original filename

### 7. Disable SVG Uploads
**Why**: SVG can contain JavaScript
**Current**: Already excluded from allowed types ✅

### 8. Store Outside Web Root (Production)
**Why**: Prevent direct execution even if file extension is spoofed
**Solution**: Store in `/var/uploads` instead of `/public`, serve via proxy

### 9. Logging & Monitoring
**Why**: Detect suspicious patterns
**Solution**: Log all upload attempts with user ID, IP, file hash

```javascript
console.log({
  event: 'profile_picture_upload',
  userId: req.user.id,
  ip: req.ip,
  filename: req.file.filename,
  size: req.file.size,
  mimetype: req.file.mimetype,
  timestamp: new Date()
});
```

### 10. Cloud Storage (Production)
**Why**: Better security, CDN, automatic backups
**Solution**: AWS S3 with signed URLs, Cloudflare R2, or similar

## Priority Implementation Order

1. **HIGH**: Image re-encoding with `sharp` (strips malicious metadata)
2. **HIGH**: Rate limiting (prevents abuse)
3. **MEDIUM**: CSP headers (prevents script execution)
4. **MEDIUM**: Virus scanning (production only)
5. **LOW**: Separate domain (production optimization)

## Testing Malware Detection

Test with these files:
1. Rename `.exe` to `.jpg` → Should fail magic number check ✅
2. Polyglot file (valid image + executable) → Would pass current checks ⚠️
3. Image with malicious EXIF data → Would pass current checks ⚠️

**Recommendation**: Implement image re-encoding ASAP to handle cases 2 & 3.
