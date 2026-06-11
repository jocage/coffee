import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coffee-journey.example"),
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
      <body>{children}</body>
    </html>
  );
}
