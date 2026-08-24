import { NextResponse } from "next/server";
import { getJudgeMeConfig, getJudgeMeProducts } from "@/lib/judgeme";
import fs from "fs";
import path from "path";

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
      pictures = [],
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

    // Process user-uploaded base64 images
    const uploadedPictures: { urls: { small: string; original: string } }[] = [];
    const pictureUrlsForJudgeMe: string[] = [];

    if (Array.isArray(pictures) && pictures.length > 0) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (let i = 0; i < Math.min(pictures.length, 5); i++) {
          const picStr = pictures[i];
          if (typeof picStr === "string" && picStr.startsWith("data:image")) {
            const matches = picStr.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches[2]) {
              const ext = matches[1].toLowerCase().replace("jpeg", "jpg");
              const fileName = `review-${Date.now()}-${i + 1}.${ext}`;
              const filePath = path.join(uploadDir, fileName);
              const buffer = Buffer.from(matches[2], "base64");
              fs.writeFileSync(filePath, buffer);

              const publicUrl = `/uploads/reviews/${fileName}`;
              uploadedPictures.push({
                urls: {
                  small: publicUrl,
                  original: publicUrl,
                },
              });
            }
          } else if (typeof picStr === "string" && picStr.startsWith("http")) {
            uploadedPictures.push({
              urls: {
                small: picStr,
                original: picStr,
              },
            });
            pictureUrlsForJudgeMe.push(picStr);
          }
        }
      } catch (err) {
        console.error("Error saving review images:", err);
      }
    }

    const products = await getJudgeMeProducts();
    const numericId = productId
      ? String(productId).replace(/^gid:\/\/shopify\/Product\//, "")
      : "";

    const matchedProduct = products.find((p) => {
      if (
        productHandle &&
        p.handle?.toLowerCase() === productHandle.toLowerCase()
      ) {
        return true;
      }
      if (numericId && String(p.external_id) === String(numericId)) {
        return true;
      }
      return false;
    });

    const targetProductId = matchedProduct
      ? String(matchedProduct.external_id || matchedProduct.id)
      : numericId;

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

    if (targetProductId) {
      payload.id = targetProductId;
    }
    if (productHandle) {
      payload.handle = productHandle;
    }
    if (pictureUrlsForJudgeMe.length > 0) {
      payload.picture_urls = pictureUrlsForJudgeMe;
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
      uploadedPictures,
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
