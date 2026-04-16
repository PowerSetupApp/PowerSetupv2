import type { Metadata } from "next";
import { Calistoga, Plus_Jakarta_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

const fontDisplay = Calistoga({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PowerSetup",
  description: "Camping-Elektrik-Planer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${fontDisplay.variable} ${fontBody.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="relative flex min-h-dvh flex-col font-sans text-base leading-relaxed">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -left-[20%] -top-[30%] h-[min(70vw,520px)] w-[min(90vw,640px)] rounded-full bg-primary/[0.11] blur-3xl motion-reduce:opacity-0 dark:bg-primary/20" />
          <div className="absolute -bottom-[25%] -right-[15%] h-[min(60vw,480px)] w-[min(75vw,520px)] rounded-full bg-accent/[0.18] blur-3xl motion-reduce:opacity-0 dark:bg-accent/25" />
          <div
            className="absolute inset-0 opacity-[0.4] dark:opacity-[0.22]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
