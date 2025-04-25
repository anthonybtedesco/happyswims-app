import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { colors } from "@/lib/colors";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/lib/debug/environment'
import GoogleApiScript from '@/components/GoogleApiScript'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happy Swims App",
  description: "Happy Swims App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleApiScript />
      </head>
      <body 
        style={{
          background: colors.common.background,
          color: colors.text.primary
        }}
        className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
