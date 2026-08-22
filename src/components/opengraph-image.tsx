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
          background: "linear-gradient(145deg, #0B1120 0%, #0F172A 40%, #162444 100%)",
          color: "#FAFAF9",
          padding: "40px",
        }}
      >
        {/* Subtle decorative background glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            height: "300px",
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, rgba(30, 95, 191, 0.08) 50%, transparent 80%)",
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
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
          }}
        />

        {/* Real Brand Logo Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_OG_BASE64}
          alt="MZ by LIORA"
          width={340}
          height={227}
          style={{
            objectFit: "contain",
          }}
        />

        {/* Page Title (if dynamic page) */}
        {!isDefaultTitle && (
          <p
            style={{
              marginTop: 16,
              fontSize: 42,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              color: "#FFFFFF",
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
            marginTop: isDefaultTitle ? 22 : 12,
            padding: "8px 26px",
            borderRadius: 999,
            background: "rgba(20, 184, 166, 0.12)",
            border: "1px solid rgba(20, 184, 166, 0.35)",
          }}
        >
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#2DD4BF",
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
            fontSize: 15,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.4)",
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
