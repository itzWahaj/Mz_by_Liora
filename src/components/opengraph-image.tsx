import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/constants";
import { LOGO_OG_BASE64 } from "@/lib/logo-base64";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props
): Promise<ImageResponse> {
  const isDefaultTitle = !props?.title || props.title === "MZ by LIORA";
  const title = props?.title || "MZ by LIORA";

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
          position: "relative",
          background: "linear-gradient(135deg, #FAF9F4 0%, #FFFDF8 45%, #F4EFE6 100%)",
          color: "#303515",
          padding: "40px",
        }}
      >
        {/* Subtle decorative background glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "350px",
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(216, 187, 122, 0.25) 0%, rgba(89, 101, 34, 0.12) 50%, transparent 80%)",
          }}
        />

        {/* Decorative inner frame */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
            bottom: "24px",
            border: "2px solid rgba(216, 187, 122, 0.5)",
            borderRadius: "24px",
          }}
        />

        {/* Real Brand Logo Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_OG_BASE64}
          alt="MZ by LIORA"
          width={380}
          height={253}
          style={{
            objectFit: "contain",
          }}
        />

        {/* Page Title (if dynamic page) */}
        {!isDefaultTitle && (
          <p
            style={{
              marginTop: 14,
              fontSize: 38,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              color: "#4D581E",
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            {title}
          </p>
        )}

        {/* Tagline / Subtitle Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: isDefaultTitle ? 20 : 10,
            padding: "8px 28px",
            borderRadius: 999,
            background: "rgba(89, 101, 34, 0.12)",
            border: "1px solid rgba(216, 187, 122, 0.7)",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#596522",
              margin: 0,
            }}
          >
            {BRAND.tagline}
          </p>
        </div>

        {/* Bottom Domain Branding */}
        <p
          style={{
            position: "absolute",
            bottom: "36px",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#C49A45",
            margin: 0,
          }}
        >
          mzbyliora.com
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
