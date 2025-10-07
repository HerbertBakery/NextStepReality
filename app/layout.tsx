import "./globals.css";

export const metadata = {
  title: "Realtor CRM",
  description: "Contacts & Listings",
  // themeColor moved to `viewport` to satisfy Next.js warning
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Realtor CRM",
  },
};

// Move themeColor + viewport-fit to `viewport` export (App Router API)
export const viewport = {
  themeColor: "#0a0f1c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="bg-slate-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
