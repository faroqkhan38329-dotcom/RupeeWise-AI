const MAX_JSON_BODY_BYTES = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too_large" };

export async function readJsonBody(
  request: Request,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { ok: false, reason: "invalid" };
  }

  let raw: string;

  try {
    raw = await request.text();
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BODY_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
