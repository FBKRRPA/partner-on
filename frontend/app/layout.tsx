import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Partneron | 로그인", description: "Partneron 로그인" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
