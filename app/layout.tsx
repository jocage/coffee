import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coffee-journey.example";
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Coffee Journey",
    template: "%s | Coffee Journey"
  },
  description: "Track every cup. Share every recipe. Brew better coffee together.",
  openGraph: {
    title: "Coffee Journey",
    description: "The social brewing journal for coffee people.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#070808"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {umamiWebsiteId && umamiScriptUrl ? (
          <Script
            defer
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
