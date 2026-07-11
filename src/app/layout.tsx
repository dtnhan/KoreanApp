import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { labels } from "@/lib/labels";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  preload: false,
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${labels.siteName} — ${labels.siteTagline}`,
    template: `%s · ${labels.siteName}`,
  },
  description:
    "Website học tiếng Hàn giao diện tiếng Việt theo giáo trình Tiếng Hàn Tổng Hợp: từ vựng, ngữ pháp, hội thoại, flashcard và theo dõi tiến độ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${notoKr.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-slate-50 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">{labels.siteName}</p>
            <p className="mt-1">{labels.siteTagline}.</p>
            <p className="mt-4 text-xs text-slate-400">
              © {new Date().getFullYear()} {labels.siteName}. Nội dung học tập theo giáo trình Tiếng Hàn Tổng Hợp.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
