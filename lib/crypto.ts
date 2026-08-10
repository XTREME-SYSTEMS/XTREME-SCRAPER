/**
 * Password hashing utility using Web Crypto API (SubtleCrypto SHA-256).
 */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hexString}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (!hash.startsWith("sha256:")) {
    // Legacy plain-text password fallback
    return password === hash;
  }
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
