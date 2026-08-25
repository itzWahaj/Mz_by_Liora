import { NextResponse } from "next/server";
import { decodeIdToken, getCustomerSession } from "@/lib/customer/auth";
import { getCustomerProfile } from "@/lib/customer/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session?.accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  const profile = await getCustomerProfile(session.accessToken);
  const idPayload = session.idToken ? decodeIdToken(session.idToken) : null;

  const displayName =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    idPayload?.displayName ||
    idPayload?.firstName ||
    "Customer";

  const email = profile?.emailAddress?.emailAddress || idPayload?.email || "";

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: profile?.id || idPayload?.id || "customer",
      firstName: profile?.firstName || idPayload?.firstName || "",
      lastName: profile?.lastName || idPayload?.lastName || "",
      displayName,
      email,
    },
  });
}
