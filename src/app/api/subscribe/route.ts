import { NextRequest, NextResponse } from "next/server";

const KLAVIYO_API = "https://a.klaviyo.com/api";
const REVISION = "2024-10-15";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY?.trim();
  const listId = process.env.KLAVIYO_LIST_ID?.trim();

  if (!apiKey || !listId) {
    return NextResponse.json(
      {
        error:
          "Newsletter is not configured. Set KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID.",
      },
      { status: 503 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const headers = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    revision: REVISION,
  };

  // Step 1: Create or update the profile
  let profileId: string | null = null;
  try {
    const profileRes = await fetch(`${KLAVIYO_API}/profiles/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            properties: {
              Source: "Footer Newsletter",
            },
          },
        },
      }),
    });

    if (profileRes.status === 201) {
      const data = await profileRes.json();
      profileId = data?.data?.id ?? null;
    } else if (profileRes.status === 409) {
      // Profile already exists — extract ID from conflict response
      const data = await profileRes.json();
      profileId =
        data?.errors?.[0]?.meta?.duplicate_profile_id ?? null;
    } else {
      const detail = await profileRes.text();
      console.error("Klaviyo profile create failed", profileRes.status, detail);
      return NextResponse.json(
        { error: "Could not create profile. Please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Klaviyo profile error", err);
    return NextResponse.json(
      { error: "Could not reach the newsletter service." },
      { status: 502 }
    );
  }

  if (!profileId) {
    return NextResponse.json(
      { error: "Could not resolve profile. Please try again." },
      { status: 502 }
    );
  }

  // Step 2: Add the profile to the list
  try {
    const listRes = await fetch(
      `${KLAVIYO_API}/lists/${listId}/relationships/profiles/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: [{ type: "profile", id: profileId }],
        }),
      }
    );

    // 204 = added, 200/201 also fine, 4xx is a real failure
    if (listRes.ok || listRes.status === 204) {
      return NextResponse.json({ ok: true });
    }

    const detail = await listRes.text();
    console.error("Klaviyo list add failed", listRes.status, detail);
    return NextResponse.json(
      { error: "Subscribed, but could not add to list. Please try again." },
      { status: 502 }
    );
  } catch (err) {
    console.error("Klaviyo list add error", err);
    return NextResponse.json(
      { error: "Could not reach the newsletter service." },
      { status: 502 }
    );
  }
}
