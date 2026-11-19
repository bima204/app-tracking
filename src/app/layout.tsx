import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f766e", // Teal-700
};

export const metadata: Metadata = {
  title: "Pelacak Produktivitas Magang",
  description: "Aplikasi Pelacak Produktivitas & Jadwal Kegiatan Magang",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pelacak Magang",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-teal-200 selection:text-teal-900`}
    >
      <body className="min-h-full bg-slate-100 text-slate-800 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
