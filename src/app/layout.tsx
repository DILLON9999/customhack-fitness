import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";
import AppLocaleSwitcher from "@/components/common/app-locale-switcher";
import { AutumnProvider } from "autumn-js/react";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitTrack - Personalized Fitness",
  description: "Your personalized fitness journey starts here",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LingoProvider loadDictionary={(locale) => loadDictionary(locale)}>
      <AutumnProvider>
        <AuthProvider>
          <html>
            <body
              className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
            >
              {children}
              <AppLocaleSwitcher />
            </body>
          </html>
        </AuthProvider>
      </AutumnProvider>
    </LingoProvider>
  );
}
