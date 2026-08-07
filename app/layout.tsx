import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapOCR — 스샷 텍스트 추출",
  description: "스크린샷 이미지에서 텍스트를 추출하고 깔끔하게 정리합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
