import type { Metadata } from "next";
import "./globals.css";
import { APP } from "@/lib/strings";

export const metadata: Metadata = {
  title: APP.metaTitle,
  description: APP.metaDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
