import {
  AdminAuthError,
  requireAdminSession,
} from "../../../_lib/admin-auth.mjs";
import { validateModerationStatus } from "../../../_lib/guestbook-core.mjs";

interface D1Result {
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
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
  params: { id: string };
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function handleError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return json({ error: error.message }, error.status);
  }
  return json(
    { error: error instanceof Error ? error.message : "留言操作失败" },
    400,
  );
}

export async function onRequestPatch({ request, env, params }: Context) {
  try {
    await requireAdminSession(request, env);
    const body = (await request.json()) as { status?: unknown };
    const status = validateModerationStatus(body.status);
    const now = new Date().toISOString();
    const approvedAt = status === "approved" ? now : null;
    const result = await env.GUESTBOOK_DB.prepare(
      `UPDATE guestbook_messages
       SET status = ?, updated_at = ?, approved_at = ?
       WHERE id = ?`,
    )
      .bind(status, now, approvedAt, params.id)
      .run();
    if (!result.success) throw new Error("留言更新失败");
    return json({ success: true, status });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestDelete({ request, env, params }: Context) {
  try {
    await requireAdminSession(request, env);
    const result = await env.GUESTBOOK_DB.prepare(
      "DELETE FROM guestbook_messages WHERE id = ?",
    )
      .bind(params.id)
      .run();
    if (!result.success) throw new Error("留言删除失败");
    return json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
