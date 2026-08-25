import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { getCustomerProfile } from "@/lib/customer/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session?.accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  const profile = await getCustomerProfile(session.accessToken);

  if (!profile) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: profile.id,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      displayName: profile.displayName || profile.firstName || "Customer",
      email: profile.emailAddress?.emailAddress || "",
    },
  });
}
