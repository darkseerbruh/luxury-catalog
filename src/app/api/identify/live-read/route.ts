import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { LiveReadResponse } from "@/lib/identify/types";

export const dynamic = "force-dynamic";

/**
 * The live "logo captured" check behind the camera viewfinder chip.
 *
 * While the user films, the client sends one small frame every few seconds and
 * asks a single cheap question: is a brand marking readable in this frame, and
 * what does it say? The moment we answer yes, the client shows "Logo captured"
 * and stops pinging — so a typical session costs a handful of Haiku calls, not
 * a stream. This is deliberately NOT the identifier; it's capture feedback that
 * teaches the user to linger on the stamp without being lectured.
 */

const MAX_BYTES = 2 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

const LIVE_READ_PROMPT = `This is one frame from a live camera feed pointed at a handbag in a store. Answer ONE question: is there a brand marking in this frame that you can actually READ (an embossed or printed logo, a woven interior label, a stamped medallion/charm, an engraved hardware piece, or a store price tag)?

Respond with a JSON object ONLY (no markdown):
{
  "readable": true or false — true ONLY if you can read actual text,
  "kind": "stamp" | "label" | "tag" | "medallion" | "print" | "none",
  "text": "the text exactly as read (e.g. 'the sak', 'COACH', '$18.99'), or null"
}

Rules: no guessing, no inferring a brand from shape or style. readable=true requires legible characters in THIS frame. A price tag counts (kind: "tag").`;

export async function POST(req: Request) {
  // Tighter window than the main identify limit but a higher count: pings are
  // throttled client-side to ~1 per 2.5s and stop on first success, so 40/5min
  // covers a real haul session while capping the worst case at pennies.
  const limit = rateLimit("identify-live-read", clientIp(req.headers), 40, 5 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { readable: false, kind: "none", text: null, error: "Rate limited." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { readable: false, kind: "none", text: null, error: "Not configured." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { readable: false, kind: "none", text: null, error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = formData.get("frame");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { readable: false, kind: "none", text: null, error: "No frame provided." },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(file.type) || file.size > MAX_BYTES) {
    return Response.json(
      { readable: false, kind: "none", text: null, error: "Bad frame." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      // Haiku: this is a yes/no + short read on one small frame, latency and
      // cost matter more than depth. The full identify stays on Sonnet.
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/webp",
                data: Buffer.from(bytes).toString("base64"),
              },
            },
            { type: "text", text: LIVE_READ_PROMPT },
          ],
        },
      ],
    });
    const raw = (message.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(
      raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    ) as Record<string, unknown>;

    const kind = (["stamp", "label", "tag", "medallion", "print"].includes(
      parsed.kind as string
    )
      ? parsed.kind
      : "none") as LiveReadResponse["kind"];
    const text =
      typeof parsed.text === "string" && parsed.text.trim() ? parsed.text.trim() : null;
    const response: LiveReadResponse = {
      readable: parsed.readable === true && text !== null,
      kind,
      text,
    };
    return Response.json(response);
  } catch (err) {
    console.error("live-read error:", err);
    return Response.json(
      { readable: false, kind: "none", text: null, error: "Could not read frame." },
      { status: 500 }
    );
  }
}
