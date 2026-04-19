import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrepWise — WAEC & NECO Exam Preparation',
  description: 'AI-powered past questions and explanations for Nigerian secondary school students.',
  keywords: ['WAEC', 'NECO', 'past questions', 'exam prep', 'Nigeria', 'SS3'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PrepWise',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'PrepWise — WAEC & NECO Exam Preparation',
    description: 'AI-powered past questions for Nigerian secondary school students.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D2137',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}