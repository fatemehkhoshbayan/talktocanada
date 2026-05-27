import type { Metadata } from "next";
import { LiveRegion } from "@/components/LiveRegion";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkToCanada — Voice-first settlement assistant",
  description:
    "Voice-first AI settlement companion for newcomers to Canada. Speak in your language. Get clear answers about SIN, health cards, IRCC, banking, housing, driver's licenses, taxes, and PR. Critical appointments go straight to your Google Calendar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-paper-3 focus:px-3 focus:py-2 focus:text-ink focus:ring-2 focus:ring-accent"
        >
          Skip to main content
        </a>
        {children}
        <LiveRegion />
      </body>
    </html>
  );
}
