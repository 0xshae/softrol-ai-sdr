import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Softrol Revenue Desk",
  description: "AI inbound SDR for complex industrial sales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
