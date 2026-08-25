import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, decodeIdToken } from "@/lib/customer/auth";
import { getCustomerProfile } from "@/lib/customer/client";

const KLAVIYO_API = "https://a.klaviyo.com/api";
const REVISION = "2024-10-15";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "unauthorized", message: "Please log in to manage preferences." },
      { status: 401 }
    );
  }

  // Resolve customer email
  let email = "";
  const profile = await getCustomerProfile(session.accessToken);
  email = profile?.emailAddress?.emailAddress || "";

  if (!email && session.idToken) {
    const idData = decodeIdToken(session.idToken);
    email = idData?.email || "";
  }

  if (!email) {
    const body = await req.json().catch(() => ({}));
    email = body.email || "";
  }

  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY?.trim();
  const listId = process.env.KLAVIYO_LIST_ID?.trim();

  if (apiKey && listId && email) {
    const headers = {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      revision: REVISION,
    };

    try {
      // Find profile ID in Klaviyo by email
      const filter = encodeURIComponent(`equals(email,"${email}")`);
      const getProfileRes = await fetch(
        `${KLAVIYO_API}/profiles/?filter=${filter}`,
        { headers }
      );

      if (getProfileRes.ok) {
        const json = await getProfileRes.json();
        const profileId = json?.data?.[0]?.id;

        if (profileId) {
          // Remove profile from newsletter list
          await fetch(
            `${KLAVIYO_API}/lists/${listId}/relationships/profiles/`,
            {
              method: "DELETE",
              headers,
              body: JSON.stringify({
                data: [{ type: "profile", id: profileId }],
              }),
            }
          );
        }
      }
    } catch (err) {
      console.error("Klaviyo unsubscribe error:", err);
    }
  }

  return NextResponse.json({
    success: true,
    subscribed: false,
    message: "You have been unsubscribed from promotional emails.",
  });
}
