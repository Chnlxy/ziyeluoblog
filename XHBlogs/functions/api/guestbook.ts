import {
  GuestbookValidationError,
  normalizeGuestbookInput,
  publicMessage,
} from "../_lib/guestbook-core.mjs";
import { verifyTurnstileToken } from "../_lib/turnstile.mjs";

interface D1Result<T> {
  results?: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<never>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  GUESTBOOK_DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT_SECRET: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface MessageRow {
  id: string;
  nickname: string;
  website: string | null;
  content: string;
  created_at: string;
}

interface Cursor {
  createdAt: string;
  id: string;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function parseCursor(value: string | null): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(atob(value)) as Cursor;
    if (!parsed.createdAt || !parsed.id) throw new Error("invalid cursor");
    return parsed;
  } catch {
    throw new Error("分页参数无效");
  }
}

function encodeCursor(message: { createdAt: string; id: string }) {
  return btoa(JSON.stringify({ createdAt: message.createdAt, id: message.id }));
}

async function sha256Hmac(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestGet({ request, env }: Context) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1),
    50,
  );
  let cursor: Cursor | null;
  try {
    cursor = parseCursor(url.searchParams.get("cursor"));
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "分页参数无效" },
      400,
    );
  }

  const statement = cursor
    ? env.GUESTBOOK_DB.prepare(
        `SELECT id, nickname, website, content, created_at
         FROM guestbook_messages
         WHERE status = 'approved'
           AND (created_at < ? OR (created_at = ? AND id < ?))
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      ).bind(cursor.createdAt, cursor.createdAt, cursor.id, limit + 1)
    : env.GUESTBOOK_DB.prepare(
        `SELECT id, nickname, website, content, created_at
         FROM guestbook_messages
         WHERE status = 'approved'
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      ).bind(limit + 1);

  const result = await statement.all<MessageRow>();
  const rows = result.results || [];
  const visibleRows = rows.slice(0, limit);
  const messages = visibleRows.map(publicMessage);

  return json({
    messages,
    nextCursor:
      rows.length > limit && messages.length > 0
        ? encodeCursor(messages[messages.length - 1])
        : null,
  });
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 8192) {
      return json({ error: "请求内容过大" }, 413);
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const message = normalizeGuestbookInput(body);
    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!turnstileToken) {
      return json({ error: "请先完成人机验证" }, 400);
    }

    const remoteIp = request.headers.get("CF-Connecting-IP");
    const validTurnstile = await verifyTurnstileToken({
      secret: env.TURNSTILE_SECRET_KEY,
      token: turnstileToken,
      remoteIp,
    });
    if (!validTurnstile) {
      return json({ error: "人机验证失败，请刷新后重试" }, 400);
    }

    const rateKey = await sha256Hmac(
      remoteIp || "unknown-visitor",
      env.RATE_LIMIT_SECRET,
    );
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60_000).toISOString();
    const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    const recent = await env.GUESTBOOK_DB.prepare(
      `SELECT
         SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS minute_count,
         COUNT(*) AS hour_count
       FROM guestbook_messages
       WHERE rate_key = ? AND created_at >= ?`,
    )
      .bind(minuteAgo, rateKey, hourAgo)
      .first<{ minute_count: number; hour_count: number }>();

    if ((recent?.minute_count || 0) >= 1) {
      return json({ error: "留言太频繁，请一分钟后再试" }, 429);
    }
    if ((recent?.hour_count || 0) >= 10) {
      return json({ error: "本小时留言次数已达上限" }, 429);
    }

    const id = crypto.randomUUID();
    const createdAt = now.toISOString();
    await env.GUESTBOOK_DB.prepare(
      `INSERT INTO guestbook_messages
         (id, nickname, website, content, status, created_at, updated_at, approved_at, rate_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
      .bind(
        id,
        message.nickname,
        message.website,
        message.content,
        "pending",
        createdAt,
        createdAt,
        rateKey,
      )
      .run();

    return json(
      { message: "留言已提交，审核后会公开展示。", id },
      202,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json({ error: "请求内容格式无效" }, 400);
    }
    if (error instanceof GuestbookValidationError) {
      return json({ error: error.message }, 400);
    }
    console.error("Guestbook submission failed", error);
    return json({ error: "留言提交失败" }, 500);
  }
}
