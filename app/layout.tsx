import { CommandPalette } from '@/components/CommandPalette';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { AppThemeRuntime } from "@/components/AppThemeRuntime";
import { DemoModeBanner } from "@/components/DemoModeBanner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const dynamic = 'force-dynamic';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenBookshelf",
  description: "Your connected personal library",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenBookshelf",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const demoModeByFlag = process.env.NEXT_PUBLIC_SUPABASE_DEMO === "true";
  const hasSupabaseCredentials = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const demoModeActive = demoModeByFlag || !hasSupabaseCredentials;
  const demoModeReason = demoModeByFlag
    ? "NEXT_PUBLIC_SUPABASE_DEMO=true"
    : "missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY";

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased flex flex-col min-h-screen app-shell"
      >
        <CommandPalette />
        <Toaster position="top-center" richColors />
        <AppThemeRuntime />
        
        <OnboardingDialog />
        {/* Main wrapper */}
        <div className="flex-1 flex flex-col motion-page-enter">
          {children}
        </div>
        {demoModeActive && <DemoModeBanner reason={demoModeReason} />}
      </body>
    </html>
  );
}
