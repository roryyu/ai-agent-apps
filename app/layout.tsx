import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 助手",
  description: "对话式生成式 AI 应用",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
