import type { Metadata } from "next";
import { LiveRegion } from "@/components/LiveRegion";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkToCanada — Voice-first settlement assistant",
  description:
    "Voice-first AI settlement companion for newcomers to Canada. Speak in your language. Get clear answers about SIN, health cards, IRCC, banking, housing, driver's licenses, taxes, and PR. Critical appointments go straight to your Google Calendar.",
  icons: {
    icon: "/assets/logo-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        {children}
        <LiveRegion />
      </body>
    </html>
  );
}
