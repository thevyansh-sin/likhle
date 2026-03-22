import Link from 'next/link';
import { siteVersion, siteVersionPrefix } from '../lib/site';
import ThemeToggle from './theme-toggle';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/generate', label: 'Generate' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
];

export default function InfoPageLayout({ eyebrow, title, description, updatedLabel, children }) {
  return (
    <main className="info-page">
      <nav className="info-nav">
        <Link href="/" className="info-logo">likhle<span className="logo-dot">.</span></Link>
        <div className="info-nav-links">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="info-nav-link">
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>

      <section className="info-hero" data-reveal>
        <div className="info-kicker">{eyebrow}</div>
        <h1 className="info-title">{title}</h1>
        <p className="info-description">{description}</p>
        <div className="info-updated">{updatedLabel}</div>
      </section>

      <div className="info-shell" data-reveal>{children}</div>

      <footer className="info-footer">
        <div className="info-footer-links">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="info-footer-link">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="info-footer-note">
          <span>These pages are here to explain the current product clearly, with the same sharper tone as the tool itself.</span>
          <span className="info-footer-version site-version-badge">
            <span className="site-version-prefix">{siteVersionPrefix}</span>
            <span className="site-version-number">{siteVersion}</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
