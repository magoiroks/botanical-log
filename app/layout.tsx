import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "Botanical Log",
  description: "友人と花の発見を記録・共有するアンティーク植物図鑑アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Botanical Log",
  },
};

export const viewport: Viewport = {
  themeColor: "#3E2723",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
