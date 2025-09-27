import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Commity Analytics - GitHub Analytics Tool",
  description: "Track, analyze, and rank GitHub contributors with comprehensive insights into developer activity, repository statistics, and community engagement metrics.",
  keywords: "GitHub, analytics, developers, leaderboard, contributions, repositories, commits",
  authors: [{ name: "WaleedCodes", url: "https://github.com/waleedcodes" }],
  creator: "WaleedCodes",
  publisher: "WaleedCodes",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://commity-analytics.vercel.app',
    siteName: 'Commity Analytics',
    title: 'Commity Analytics - GitHub Analytics Tool',
    description: 'Track, analyze, and rank GitHub contributors with comprehensive insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Commity Analytics - GitHub Analytics Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commity Analytics - GitHub Analytics Tool',
    description: 'Track, analyze, and rank GitHub contributors with comprehensive insights.',
    images: ['/og-image.png'],
    creator: '@waleedcodes',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors`}
      >
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">C</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Commity Analytics</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">GitHub Analytics Tool</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                  <a href="https://github.com/waleedcodes/Commity" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    GitHub
                  </a>
                  <a href="https://github.com/waleedcodes/Commity/issues" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    Issues
                  </a>
                  <a href="https://github.com/waleedcodes" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    @waleedcodes
                  </a>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  © 2025 Commity Analytics. Built with ❤️ by{' '}
                  <a href="https://github.com/waleedcodes" className="text-blue-600 hover:text-blue-500 transition-colors">
                    WaleedCodes
                  </a>
                  {' '}• Made with Next.js & Express.js
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
