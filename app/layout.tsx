import type { Metadata } from "next";
import "./globals.css";
import { sans } from "./fonts";

export const metadata: Metadata = {
  title: "Q&A System",
  description: "Simple Q&A app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
