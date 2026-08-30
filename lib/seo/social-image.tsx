import { ImageResponse } from "next/og"

export function createSocialImage(title: string, description: string): ImageResponse {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#ffffff", color: "#171717", padding: "72px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: 32, fontWeight: 700 }}>
        <div style={{ display: "flex", background: "#ffb200", width: "36px", height: "36px", borderRadius: "8px" }} />
        ShipBits
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>{title.slice(0, 100)}</div>
        <div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: "#666666" }}>{description.slice(0, 180)}</div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: "#666666" }}>Products worth discovering. Builders worth supporting.</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
