import type { Metadata } from "next";
import { Geist, Geist_Mono, Shippori_Mincho } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// コラム記事の見出し用。データページの機械的な数字表と、読み物であるコラムを書体で区別する
const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "プロ野球LAB | NPB優勝確率・タイトル獲得確率の独自分析",
    template: "%s | プロ野球LAB",
  },
  description:
    "NPB(プロ野球)のデータを独自に分析。セ・パ12球団の優勝確率、貯金・借金、マジックナンバー、タイトルレースの獲得確率、2軍注目選手の1軍換算成績を毎日更新します。",
  openGraph: {
    siteName: "プロ野球LAB",
    locale: "ja_JP",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "プロ野球LAB",
  url: siteUrl,
  description:
    "NPB(プロ野球)のデータを独自に分析。優勝確率・タイトル獲得確率・2軍注目選手の1軍換算成績を毎日更新します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${shipporiMincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
