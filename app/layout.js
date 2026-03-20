import Script from "next/script";
import './globals.css';

export const metadata = {
  title: 'Likhle — AI Captions for Gen Z India',
  description: 'AI-powered captions, bios & hashtags for Indian creators. Hinglish mode, tone detection & more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
      <body>{children}</body>
    </html>
  );
}