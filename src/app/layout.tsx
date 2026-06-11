import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Softrol Revenue Desk",
  description: "Inbound qualification for complex laundry automation sales.",
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
