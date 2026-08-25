import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent, type MetaCapiEventPayload } from "@/lib/meta/capi";

export const runtime = "nodejs";

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_name, event_id, event_source_url, custom_data, user_data } = body;

    if (!event_name || !event_id) {
      return NextResponse.json(
        { error: "Missing required fields: event_name and event_id" },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const fbp = req.cookies.get("_fbp")?.value || user_data?.fbp || null;
    const fbc = req.cookies.get("_fbc")?.value || user_data?.fbc || null;

    const eventPayload: MetaCapiEventPayload = {
      event_name,
      event_id,
      event_source_url: event_source_url || req.headers.get("referer") || undefined,
      action_source: "website",
      user_data: {
        ...user_data,
        clientIpAddress: clientIp || user_data?.clientIpAddress || undefined,
        clientUserAgent: userAgent || user_data?.clientUserAgent || undefined,
        fbp,
        fbc,
      },
      custom_data,
    };

    const result = await sendMetaCapiEvent(eventPayload);

    return NextResponse.json({
      success: result.success,
      events_received: result.events_received,
      error: result.error,
    });
  } catch (error) {
    console.error("[Meta Events API Route Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
