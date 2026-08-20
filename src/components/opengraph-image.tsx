import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props
): Promise<ImageResponse> {
  const title = props?.title || process.env.SITE_NAME || "MZ by LIORA";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0F172A 0%, #1a2744 100%)",
          color: "#FAFAF9",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 140,
            width: 140,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "3px solid #14B8A6",
            background: "#FAFAF9",
            color: "#0F172A",
            fontSize: 42,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          MZ
        </div>
        <p
          style={{
            marginTop: 40,
            fontSize: 56,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          {title}
        </p>
        <p
          style={{
            marginTop: 12,
            fontSize: 20,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#14B8A6",
          }}
        >
          {BRAND.tagline}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
