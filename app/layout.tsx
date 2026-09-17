import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "JalNetra Global — AI-Powered Climate & Water Intelligence Digital Twin",
  description:
    "Multi-scale climate, rainfall and water intelligence platform fusing NASA GPM IMERG satellite precipitation, climate teleconnections (ENSO/IOD/MJO), IoT sensor telemetry, and spatiotemporal digital twin simulations.",
  keywords: [
    "JalNetra",
    "Climate Intelligence",
    "Digital Twin",
    "Satellite Precipitation",
    "GPM IMERG",
    "Flood Nowcasting",
    "ENSO",
    "Water Intelligence",
    "Geospatial AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
