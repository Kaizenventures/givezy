import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { buildMetadata, organizationJsonLd, localBusinessJsonLd } from "@/lib/seo";
import { appEnv } from "@/lib/env";

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#059669" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd()),
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {appEnv() === "staging" && (
          <div className="bg-amber-400 text-amber-950 text-center text-sm font-semibold py-1.5 px-4">
            Staging — test data and test payments. Nothing here is real.
          </div>
        )}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
