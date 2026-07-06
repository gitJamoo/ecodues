// Inline logo for next/og image generation — satori can't fetch /public
// assets, so the share card and opengraph-image embed it as a data URI.
// Keep the artwork in sync with src/app/icon.svg.
export const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="leafGradient" x1="120" y1="100" x2="380" y2="360" gradientUnits="userSpaceOnUse">
<stop stop-color="#8CF76B"/>
<stop offset="1" stop-color="#33C35D"/>
</linearGradient>
</defs>
<rect x="0" y="0" width="512" height="512" rx="110" fill="#081B17"/>
<path d="M135 170 C170 125 245 120 340 128 C322 178 270 215 205 215 H135 Z" fill="url(#leafGradient)"/>
<path d="M135 297 C170 252 245 247 340 255 C322 305 270 342 205 342 H135 Z" fill="url(#leafGradient)"/>
</svg>`;

// base64 rather than URL-encoded: satori's <img> handling is only reliable
// with base64 data URIs. btoa exists in both the edge and Node runtimes and
// is safe here because LOGO_SVG is pure ASCII.
export const LOGO_DATA_URI = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;
