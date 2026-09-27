import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06080b",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 40 40">
          <path
            d="M20 3.5 34 8.6v10.2c0 8.6-5.8 15.2-14 17.7C11.8 34 6 27.4 6 18.8V8.6L20 3.5Z"
            fill="#2ee6a0"
          />
          <path
            d="m13.6 20.2 4.6 4.6 8.4-9.2"
            fill="none"
            stroke="#04130c"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
