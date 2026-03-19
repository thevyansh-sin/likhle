import './globals.css';

export const metadata = {
  title: 'Likhle — AI Captions for Gen Z India',
  description: 'AI-powered captions, bios & hashtags for Indian creators. Hinglish mode, tone detection & more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}