/**
 * Strict Security Image File Validator
 * Validates file size, MIME type whitelist, and magic header signatures to prevent executable/virus upload attacks.
 */

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

export function validateImageBuffer(fileBuffer, declaredMimeType = '', maxSizeMB = 2) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    return { valid: false, error: 'Empty or invalid image data.' };
  }

  // 1. Strict Size Check
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (fileBuffer.length > maxBytes) {
    const actualMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${actualMB}MB) exceeds maximum allowed limit of ${maxSizeMB}MB.`
    };
  }

  // 2. MIME Type Whitelist Check
  const normalizedMime = (declaredMimeType || '').toLowerCase();
  if (normalizedMime && !ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: `Invalid MIME type (${declaredMimeType}). Allowed: JPEG, PNG, WEBP, GIF, SVG.`
    };
  }

  // 3. Magic Bytes Header Signature Validation
  const headerHex = fileBuffer.slice(0, 12).toString('hex').toUpperCase();

  const isJpeg = headerHex.startsWith('FFD8FF');
  const isPng = headerHex.startsWith('89504E47');
  const isGif = headerHex.startsWith('47494638');
  const isWebp = headerHex.startsWith('52494646') && fileBuffer.slice(8, 12).toString('ascii') === 'WEBP';
  
  const previewText = fileBuffer.slice(0, 100).toString('utf8').trim().toLowerCase();
  const isSvg = previewText.includes('<svg') || (previewText.includes('<?xml') && previewText.includes('<svg'));

  if (!isJpeg && !isPng && !isGif && !isWebp && !isSvg) {
    return {
      valid: false,
      error: 'Security alert: File magic bytes do not match a valid image signature. Upload rejected.'
    };
  }

  let safeExt = 'jpg';
  if (isPng) safeExt = 'png';
  else if (isWebp) safeExt = 'webp';
  else if (isGif) safeExt = 'gif';
  else if (isSvg) safeExt = 'svg';

  return {
    valid: true,
    safeExt,
    mimeType: isSvg ? 'image/svg+xml' : isPng ? 'image/png' : isWebp ? 'image/webp' : isGif ? 'image/gif' : 'image/jpeg'
  };
}
