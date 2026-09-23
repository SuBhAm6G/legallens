import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { SessionProvider } from "@/components/SessionProvider";
import { APP_NAME, APP_TAGLINE, LEGAL_DISCLAIMER } from "@/lib/constants";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: `${APP_TAGLINE} ${LEGAL_DISCLAIMER}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="min-h-full bg-[var(--paper)] font-sans text-stone-900 antialiased">
        <a 
          href="#main-content" 
          className="absolute -top-10 left-0 bg-navy px-4 py-2 text-white transition-all focus:top-0 focus:z-50"
        >
          Skip to main content
        </a>
        <SessionProvider>
          <AppHeader />
          <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
