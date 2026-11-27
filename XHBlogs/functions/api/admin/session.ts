import {
  AdminAuthError,
  requireAdminSession,
} from "../../_lib/admin-auth.mjs";

interface Env {
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

export async function onRequestGet({ request, env }: Context) {
  try {
    return json(await requireAdminSession(request, env));
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "会话检查失败" }, 500);
  }
}
