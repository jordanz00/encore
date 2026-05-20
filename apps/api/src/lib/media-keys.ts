/**
 * Validate S3 object keys before presign or redirect (path traversal guard).
 */
const KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-./]{0,511}$/;

export function isSafeMediaKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("..") || key.startsWith("/") || key.includes("//")) return false;
  return KEY_RE.test(key);
}
