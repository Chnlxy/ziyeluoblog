const encoder = new TextEncoder();

export const ADMIN_COOKIE = "ziyeluo_admin_session";
export const SESSION_SECONDS = 12 * 60 * 60;
export const LOGIN_FAILURE_LIMIT = 5;

export class AdminAuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function bytesToBase64Url(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function bytesToHex(value) {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(value, secret) {
  const key = await hmacKey(secret);
  return crypto.subtle.sign("HMAC", key, encoder.encode(value));
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return "";
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function secureEqualHex(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function hmacSha256Hex(value, secret) {
  return bytesToHex(await sign(value, secret));
}

export async function createAdminSession(secret, now = Date.now()) {
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        sub: "guestbook-admin",
        exp: Math.floor(now / 1000) + SESSION_SECONDS,
      }),
    ),
  );
  const signature = bytesToBase64Url(await sign(payload, secret));
  return `${payload}.${signature}`;
}

export async function verifyAdminSession(
  token,
  secret,
  now = Date.now(),
) {
  try {
    const segments = String(token || "").split(".");
    if (segments.length !== 2 || !segments[0] || !segments[1]) return false;

    const expected = bytesToBase64Url(await sign(segments[0], secret));
    if (!secureEqualHex(segments[1], expected)) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(segments[0])),
    );
    return (
      payload?.sub === "guestbook-admin" &&
      Number.isInteger(payload.exp) &&
      payload.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}

export function loginIsLocked(failureCount) {
  return Number(failureCount) >= LOGIN_FAILURE_LIMIT;
}

export function adminCookie(token, maxAge = SESSION_SECONDS) {
  return `${ADMIN_COOKIE}=${token}; Path=/api/admin; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearAdminCookie() {
  return adminCookie("", 0);
}

export async function requireAdminSession(request, env) {
  const secret = String(env.ADMIN_SESSION_SECRET || "");
  if (!secret) {
    throw new AdminAuthError("管理员会话尚未配置", 500);
  }
  const token = cookieValue(request, ADMIN_COOKIE);
  if (!token || !(await verifyAdminSession(token, secret))) {
    throw new AdminAuthError("请先登录审核后台", 401);
  }
  return { authenticated: true, subject: "guestbook-admin" };
}
