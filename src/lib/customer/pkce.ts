import crypto from "crypto";

/**
 * Generates a high-entropy cryptographic random string for PKCE code_verifier.
 * RFC 7636 recommends 43-128 characters of unreserved URL-safe characters.
 */
export function generateCodeVerifier(length = 64): string {
  return crypto
    .randomBytes(length)
    .toString("base64url")
    .substring(0, Math.min(length, 128));
}

/**
 * Generates a code_challenge from code_verifier using SHA-256 (S256).
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

/**
 * Generates a random alphanumeric/base64url string for state and nonce tokens.
 */
export function generateRandomString(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
