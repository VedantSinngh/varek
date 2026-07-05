import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Varek.in Admin Console",
  description: "AI Operations & Business Management Platform",
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
