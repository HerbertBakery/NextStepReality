// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Realtor CRM",
  description: "Contacts & Listings",
  themeColor: "#0a0f1c",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Realtor CRM",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fallback if you prefer a static manifest in /public */}
        {/* <link rel="manifest" href="/manifest.webmanifest" /> */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-slate-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
