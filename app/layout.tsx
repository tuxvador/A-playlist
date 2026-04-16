import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "African Music Map",
  description: "A community app for African country music entries.",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
