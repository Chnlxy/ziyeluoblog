import {
  AdminAuthError,
  requireAdminSession,
} from "../../_lib/admin-auth.mjs";
import { publicMessage } from "../../_lib/guestbook-core.mjs";

interface D1Result<T> {
  results?: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  GUESTBOOK_DB: D1Database;
  ADMIN_SESSION_SECRET: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface AdminRow {
  id: string;
  nickname: string;
  website: string | null;
  content: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function onRequestGet({ request, env }: Context) {
  try {
    await requireAdminSession(request, env);
    const status = new URL(request.url).searchParams.get("status") || "all";
    const allowed = ["all", "pending", "approved", "hidden"];
    if (!allowed.includes(status)) {
      return json({ error: "留言状态无效" }, 400);
    }

    const statement =
      status === "all"
        ? env.GUESTBOOK_DB.prepare(
            `SELECT id, nickname, website, content, status, created_at, updated_at, approved_at
             FROM guestbook_messages
             ORDER BY created_at DESC
             LIMIT 200`,
          )
        : env.GUESTBOOK_DB.prepare(
            `SELECT id, nickname, website, content, status, created_at, updated_at, approved_at
             FROM guestbook_messages
             WHERE status = ?
             ORDER BY created_at DESC
             LIMIT 200`,
          ).bind(status);

    const result = await statement.all<AdminRow>();
    return json({
      messages: (result.results || []).map((row) => ({
        ...publicMessage(row),
        status: row.status,
        updatedAt: row.updated_at,
        approvedAt: row.approved_at,
      })),
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "留言管理数据暂时无法读取" }, 500);
  }
}
