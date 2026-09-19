// JalNetra Global — Intelligence-Grade Security Headers (OWASP Hardened)

export const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: allow self, inline scripts for Next.js hydration, eval for WebGL/three.js shaders
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Styles: allow self, inline styles for Tailwind/CSS animations
      "style-src 'self' 'unsafe-inline'",
      // Images: allow self, data URIs, blob, NASA / OpenStreetMap tile servers
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://images.unsplash.com",
      // Fonts: self, data URIs
      "font-src 'self' data:",
      // Connections: allow self, NOAA API, NASA feeds, local dev websockets
      "connect-src 'self' https://psl.noaa.gov https://*.openstreetmap.org http://localhost:* ws://localhost:* wss://localhost:*",
      // Workers: blob & self for Three.js / WebGL background compute
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

export function applySecurityHeaders(headers: Headers): Headers {
  for (const { key, value } of SECURITY_HEADERS) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return headers;
}
