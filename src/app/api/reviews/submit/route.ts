import { NextResponse } from "next/server";
import { getJudgeMeConfig } from "@/lib/judgeme";

const JUDGEME_API_BASE = "https://judge.me/api/v1";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const {
      productId,
      productHandle,
      name,
      email,
      rating,
      title,
      body: reviewBody,
    } = body;

    if (!name?.trim() || !email?.trim() || !reviewBody?.trim() || !rating) {
      return NextResponse.json(
        { success: false, message: "Please fill out all required fields." },
        { status: 400 }
      );
    }

    const { publicToken, apiToken, shopDomain } = getJudgeMeConfig();
    const tokenToUse = publicToken || apiToken;

    if (!tokenToUse || !shopDomain) {
      return NextResponse.json(
        {
          success: false,
          message: "Review service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const payload: Record<string, unknown> = {
      api_token: tokenToUse,
      shop_domain: shopDomain,
      platform: "shopify",
      name: name.trim(),
      email: email.trim(),
      rating: Number(rating),
      title: title?.trim() || "",
      body: reviewBody.trim(),
    };

    if (productHandle) {
      payload.handle = productHandle;
    } else if (productId) {
      const match = productId.match(/\/(\d+)$/);
      payload.id = match ? match[1] : productId;
    }

    const res = await fetch(`${JUDGEME_API_BASE}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        data?.message ||
        (Array.isArray(data?.errors)
          ? data.errors.join(", ")
          : typeof data?.errors === "object"
          ? Object.values(data.errors).flat().join(", ")
          : null) ||
        "Something went wrong submitting your review, please try again.";

      return NextResponse.json(
        { success: false, message: errMsg },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your review has been submitted for moderation.",
    });
  } catch (error) {
    console.error("Error in /api/reviews/submit:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong submitting your review, please try again.",
      },
      { status: 500 }
    );
  }
}
