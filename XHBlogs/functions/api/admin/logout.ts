import { clearAdminCookie } from "../../_lib/admin-auth.mjs";

export async function onRequestPost() {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "cache-control": "no-store",
        "set-cookie": clearAdminCookie(),
      },
    },
  );
}
