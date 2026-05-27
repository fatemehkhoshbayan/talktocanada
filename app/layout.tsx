import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landed",
  description:
    "Voice-first immigration help for newcomers to Canada. Speak in your language. Get clear answers about SIN, health cards, IRCC, banking, housing, driver's licenses, taxes, and PR. Critical appointments go straight to your Google Calendar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
