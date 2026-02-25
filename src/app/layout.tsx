import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KenyonCore - Materials Tracking",
  description: "Construction materials tracking and job management for Kenyon Core",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
