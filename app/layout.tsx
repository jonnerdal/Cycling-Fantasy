import { ReactNode } from "react";
import Providers from "./providers";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Cycling Fantasy</title>
      </head>
      <body className="bg-gray-100 min-h-screen font-sans">
        {/* Wrap all pages in SessionProvider via Providers.tsx */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
