import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Realtor CRM",
  description: "Simple client & property manager",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
