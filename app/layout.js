import { DM_Sans, Syne } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { PWAProvider } from './components/pwa-provider';
import ScrollToTop from './components/scroll-to-top';
import { SiteThemeProvider } from './components/site-theme-provider';
import {
  absoluteUrl,
  instagramHandle,
  instagramUrl,
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
  supportEmail,
} from './lib/site';
import { getThemeInitScript } from './lib/theme';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ${siteTitle}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: 'AI writing tool',
  referrer: 'origin-when-cross-origin',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-32.png',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: `${siteName} | ${siteTitle}`,
    description: siteDescription,
    url: '/',
    siteName,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | ${siteTitle}`,
    description: siteDescription,
    creator: instagramHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport = {
  themeColor: '#080808',
};

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    email: supportEmail,
    sameAs: [instagramUrl],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    inLanguage: 'en-IN',
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
    potentialAction: {
      '@type': 'ViewAction',
      target: absoluteUrl('/generate'),
      name: 'Open the generator',
    },
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EBEXGB44Y4"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EBEXGB44Y4');
            `,
          }}
        />
        {structuredData.map((item) => (
          <script
            key={item['@type']}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          />
        ))}
        <PWAProvider />
        <SiteThemeProvider>
          {children}
          <ScrollToTop />
        </SiteThemeProvider>
      </body>
    </html>
  );
}
