// app/layout.tsx
import "./globals.css";

export const metadata = { title: "Next Step Realty" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
