import {
  adminCookie,
  createAdminSession,
  hmacSha256Hex,
  loginIsLocked,
  secureEqualHex,
  sha256Hex,
} from "../../_lib/admin-auth.mjs";
import { verifyTurnstileToken } from "../../_lib/turnstile.mjs";

interface D1Result<T> {
  results?: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<D1Result<never>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  GUESTBOOK_DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT_SECRET: string;
  ADMIN_PASSWORD_HASH: string;
  ADMIN_SESSION_SECRET: string;
}

interface Context {
  request: Request;
  env: Env;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 2048) {
      return json({ error: "请求内容过大" }, 413);
    }

    const body = JSON.parse(rawBody) as {
      password?: unknown;
      turnstileToken?: unknown;
    };
    const password =
      typeof body.password === "string" ? body.password : "";
    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!password || password.length > 256 || !turnstileToken) {
      return json({ error: "请填写密码并完成人机验证" }, 400);
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 10 * 60_000).toISOString();
    const remoteIp = request.headers.get("CF-Connecting-IP");
    const rateKey = await hmacSha256Hex(
      remoteIp || "unknown-admin",
      env.RATE_LIMIT_SECRET,
    );
    const recent = await env.GUESTBOOK_DB.prepare(
      `SELECT COUNT(*) AS failure_count
       FROM admin_login_failures
       WHERE rate_key = ? AND failed_at >= ?`,
    )
      .bind(rateKey, cutoff)
      .first<{ failure_count: number }>();
    if (loginIsLocked(recent?.failure_count || 0)) {
      return json({ error: "登录失败次数过多，请 10 分钟后再试" }, 429);
    }

    const validTurnstile = await verifyTurnstileToken({
      secret: env.TURNSTILE_SECRET_KEY,
      token: turnstileToken,
      remoteIp,
    });
    if (!validTurnstile) {
      return json({ error: "人机验证失败，请刷新后重试" }, 400);
    }

    const passwordOk = secureEqualHex(
      await sha256Hex(password),
      String(env.ADMIN_PASSWORD_HASH || "").toLowerCase(),
    );
    if (!passwordOk) {
      await env.GUESTBOOK_DB.prepare(
        `INSERT INTO admin_login_failures (id, rate_key, failed_at)
         VALUES (?, ?, ?)`,
      )
        .bind(crypto.randomUUID(), rateKey, now.toISOString())
        .run();
      return json({ error: "密码不正确" }, 401);
    }

    await env.GUESTBOOK_DB.prepare(
      "DELETE FROM admin_login_failures WHERE rate_key = ? AND failed_at >= ?",
    )
      .bind(rateKey, cutoff)
      .run();

    const token = await createAdminSession(
      env.ADMIN_SESSION_SECRET,
      now.getTime(),
    );
    return Response.json(
      { authenticated: true },
      {
        headers: {
          "cache-control": "no-store",
          "set-cookie": adminCookie(token),
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "请求内容格式无效"
        : "登录暂时无法完成";
    return json({ error: message }, 400);
  }
}
