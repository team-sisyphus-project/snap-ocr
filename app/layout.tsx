/**
 * Template Header
 * Purpose: Next.js root layout — the HTML shell that wraps every page and sets
 *   the document language and metadata (title/description) from the string
 *   catalog.
 * Feature Unit: Shared
 * Customize: Global styles come from ./globals.css; the title/description text
 *   comes from the APP group in lib/strings.ts. Change the lang attribute to
 *   re-target the document language.
 * Depends on: ./globals.css and the APP Display String group in lib/strings.ts.
 */

import type { Metadata } from "next";
import "./globals.css";
import { APP } from "@/lib/strings";

export const metadata: Metadata = {
  title: APP.metaTitle,
  description: APP.metaDescription,
};

/** Root layout: renders the HTML document shell around every page. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
