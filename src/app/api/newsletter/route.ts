import { NextRequest, NextResponse } from "next/server";

const KLAVIYO_API = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

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
          "Newsletter is not configured. Add KLAVIYO_PRIVATE_API_KEY and KLAVIYO_LIST_ID to .env.local.",
      },
      { status: 503 }
    );
  }

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
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${KLAVIYO_API}/profile-subscription-bulk-create-jobs/`,
      {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          revision: KLAVIYO_REVISION,
        },
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              profiles: {
                data: [
                  {
                    type: "profile",
                    attributes: {
                      email,
                      subscriptions: {
                        email: {
                          marketing: {
                            consent: "SUBSCRIBED",
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
            relationships: {
              list: {
                data: {
                  type: "list",
                  id: listId,
                },
              },
            },
          },
        }),
      }
    );

    // 202 = accepted; 409 can mean already subscribed / duplicate — treat as success for UX
    if (response.ok || response.status === 409) {
      return NextResponse.json({ ok: true });
    }

    const detail = await response.text();
    console.error("Klaviyo subscribe failed", response.status, detail);

    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Klaviyo subscribe error", error);
    return NextResponse.json(
      { error: "Could not reach the newsletter service." },
      { status: 502 }
    );
  }
}
