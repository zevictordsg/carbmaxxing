import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (not next/font/google) so the site never depends on a
// runtime/build-time request to Google's font CDN. Variable weight axis,
// latin subset -- swap this file if you want a different Inter cut.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carbomaxxing",
  description: "Comunidade Carbomaxxing — by zevictor.gym",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
