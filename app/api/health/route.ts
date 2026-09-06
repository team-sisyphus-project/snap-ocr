/**
 * Template Header
 * Purpose: Liveness probe for the deployment platform. GET /api/health answers
 *   200 with a small machine-readable JSON body once the server is accepting
 *   requests, so the preview/deploy pipeline can tell "process is up" from
 *   "process is still booting". It performs no I/O and needs no configuration,
 *   so it stays green with every optional environment variable unset.
 * Feature Unit: Shared
 * Customize: Add fields to the payload if the platform needs more signal
 *   (build id, region). Keep it dependency-free — a health check that can fail
 *   for a reason unrelated to liveness is worse than none. Never include
 *   secrets, key material, or "is a key configured" flags here: this route is
 *   unauthenticated.
 * Depends on: the Node.js runtime only.
 */

export const runtime = "nodejs";
/** Never prerender or cache — a cached body would report a stale process as live. */
export const dynamic = "force-dynamic";

/** Health payload. Machine-facing, so the values are stable literals, not Display Strings. */
type Health = {
  status: "ok";
  service: "snapocr";
};

/** GET /api/health — 200 JSON while the server is accepting requests. */
export function GET(): Response {
  const body: Health = { status: "ok", service: "snapocr" };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
