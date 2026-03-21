'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './components/theme-toggle';
import { ideaPages } from './idea-pages-data';
import { siteVersion, siteVersionPrefix } from './lib/site';
import { seoPages } from './seo-pages-data';

const words = ['Captions', 'Bios', 'Hooks', 'Hashtags', 'Status'];
const marqueeItems = [
  'Platform Selector ✦',
  'Length Control ✦',
  'Quick Templates ✦',
  'Image Preview ✦',
  'Save History ✦',
  'Regenerate One ✦',
  'Copy All ✦',
  'Download Text ✦',
  'Hinglish Mode ✦',
  'No Signup ✦',
];
const featureCards = [
  {
    eyebrow: 'Templates',
    title: 'Start from ready-made ideas',
    desc: 'Use built-in templates like Goa sunset, birthday post, gym transformation, study hook, wedding dump, and more to fill the prompt instantly.',
  },
  {
    eyebrow: 'Precision',
    title: 'Choose the exact format first',
    desc: 'Instagram caption, bio, Reels hook, WhatsApp status, LinkedIn bio, or Twitter/X bio. No more hoping the AI guesses correctly.',
  },
  {
    eyebrow: 'Control',
    title: 'Dial the length up or down',
    desc: 'Pick short, medium, or long before you generate, so the result already fits your post instead of needing rewrites.',
  },
  {
    eyebrow: 'Speed',
    title: 'Regenerate only one result',
    desc: 'If 3 options are good and 1 feels weak, refresh only that card and keep the rest exactly as they are.',
  },
  {
    eyebrow: 'Memory',
    title: 'Your recent ideas stay saved',
    desc: 'Likhle now keeps recent generations in browser history, so you can come back later and reuse what worked.',
  },
  {
    eyebrow: 'Visual',
    title: 'Add an image reference',
    desc: 'Upload a photo, preview it first, and let the AI understand the mood, setting, and vibe before writing.',
  },
  {
    eyebrow: 'Desktop',
    title: 'Paste screenshots straight in',
    desc: 'On desktop, copy a screenshot and press Ctrl+V inside the prompt box to attach it instantly without opening the upload menu.',
  },
  {
    eyebrow: 'Rewrite',
    title: 'Refine one result instantly',
    desc: 'Make one option shorter, more savage, more aesthetic, more professional, or more Hinglish without regenerating the whole set.',
  },
  {
    eyebrow: 'Output',
    title: 'Copy everything or download it',
    desc: 'Take one caption, all captions, or save the full result as a text file without juggling tabs or notes.',
  },
];
const workflowSteps = [
  {
    step: '01',
    title: 'Describe the vibe',
    desc: 'Write one plain-language prompt about your photo, post, mood, or page.',
  },
  {
    step: '02',
    title: 'Set the controls',
    desc: 'Pick platform, length, tone, and extras like Hinglish, emojis, or hashtags.',
  },
  {
    step: '03',
    title: 'Save the best one',
    desc: 'Copy, download, regenerate one option, or reopen it later from recent history.',
  },
];
const proofCards = ['Platform-aware output', 'Template starters built in', 'Recent history saved', 'Copy or download fast'];

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId;

    const interval = setInterval(() => {
      setVisible(false);
      timeoutId = setTimeout(() => {
        setWordIndex((currentIndex) => (currentIndex + 1) % words.length);
        setVisible(true);
      }, 300);
    }, 2000);

    return () => {
      clearInterval(interval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <main className="main">
      <nav className="nav">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#workflow" className="nav-link">How it works</a>
          <ThemeToggle />
          <Link href="/generate" className="nav-cta">Try it free →</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">🇮🇳 Built for Indian creators and side-hustlers</div>
            <h1 className="hero-title">
              AI-powered
              <br />
              <span className="word-swap" style={{ opacity: visible ? 1 : 0 }}>
                {words[wordIndex]}
              </span>
              <br />
              that finally feel in your control
            </h1>
            <p className="hero-sub">
              Prompt likho. Platform select karo. Length choose karo. Image add karo.
              <br />
              Likhle ab sirf caption box nahi raha, proper creator tool ban gaya hai.
            </p>
            <div className="hero-actions">
              <Link href="/generate" className="btn-primary">Likhna shuru karo 🚀</Link>
              <a href="#features" className="btn-ghost">See what&apos;s new</a>
            </div>
            <div className="hero-note">Free • No signup • Hindi + English • Browser history saved</div>

            <div className="hero-proof-grid">
              {proofCards.map((card) => (
                <div key={card} className="proof-card">{card}</div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="demo-card">
              <div className="demo-topbar">
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-status">Live creator workflow</span>
              </div>

              <div className="demo-block">
                <span className="demo-label">Prompt</span>
                <p className="demo-text">Goa sunset photo, make it aesthetic but not cringe.</p>
              </div>

              <div className="demo-chip-row">
                <span className="demo-chip demo-chip-active">Instagram Caption</span>
                <span className="demo-chip">Medium</span>
                <span className="demo-chip">Aesthetic</span>
              </div>

              <div className="demo-result-card">
                <div className="demo-result-label">Fresh result</div>
                <p className="demo-result-text">
                  sunset, sea breeze, and zero unnecessary drama. Goa really knows how to romanticize life. ✨
                  <br />
                  <br />
                  #GoaDiaries #SunsetMood #BeachEnergy
                </p>
              </div>

              <div className="demo-meta-row">
                <span className="demo-meta-pill">Regenerate one</span>
                <span className="demo-meta-pill">Save history</span>
                <span className="demo-meta-pill">Copy all</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`} className="marquee-item">{item}</span>
          ))}
        </div>
      </div>

      <section className="features" id="features">
        <div className="section-header">
          <span className="section-kicker">What changed</span>
          <h2 className="section-title">Likhle now shows the product it was supposed to be</h2>
          <p className="section-copy">
            More control for the user, better output quality, and fewer annoying repeat steps.
          </p>
        </div>

        <div className="features-grid">
          {featureCards.map((feature) => (
            <div key={feature.title} className="feature-card">
              <span className="feature-eyebrow">{feature.eyebrow}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seo-links-section">
        <div className="section-header">
          <span className="section-kicker">Popular Generators</span>
          <h2 className="section-title">Browse focused pages for the main use cases</h2>
          <p className="section-copy">
            These landing pages target real search intent and drop people into the right generator flow faster.
          </p>
        </div>

        <div className="seo-link-grid">
          {seoPages.map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className="seo-link-card">
              <span className="seo-link-kicker">{page.eyebrow}</span>
              <h3 className="seo-link-title">{page.shortTitle}</h3>
              <p className="seo-link-desc">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="idea-links-section">
        <div className="section-header">
          <span className="section-kicker">Idea Guides</span>
          <h2 className="section-title">Static pages for people who search with a very specific mood in mind</h2>
          <p className="section-copy">
            These pages are packed with real examples first, then push people into the right generator setup when they want fresh options.
          </p>
        </div>

        <div className="seo-related-grid">
          {ideaPages.slice(0, 4).map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className="seo-related-card">
              <span className="seo-card-kicker">{page.eyebrow}</span>
              <h3 className="seo-card-title">{page.shortTitle}</h3>
              <p className="seo-card-text">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="workflow" id="workflow">
        <div className="section-header">
          <span className="section-kicker">How it works</span>
          <h2 className="section-title">Simple flow, smarter result</h2>
          <p className="section-copy">
            The homepage now explains the actual experience instead of sounding like a generic AI tool.
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((item) => (
            <div key={item.step} className="workflow-card">
              <div className="workflow-step">{item.step}</div>
              <h3 className="workflow-title">{item.title}</h3>
              <p className="workflow-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-shell">
          <h2 className="cta-title">Ready to go from idea to post in one tab?</h2>
          <p className="cta-sub">
            Whether it&apos;s a trip dump caption, LinkedIn bio, WhatsApp status, or Reels hook, Likhle gets there faster now.
          </p>
          <Link href="/generate" className="btn-primary btn-lg">Start for free →</Link>
        </div>
      </section>

      <footer className="footer">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <div className="footer-stack">
          <div className="footer-meta">
            <span className="footer-text">Built in India, by an Indian, for Gen Z India.</span>
            <span className="footer-version site-version-badge">
              <span className="site-version-prefix">{siteVersionPrefix}</span>
              <span className="site-version-number">{siteVersion}</span>
            </span>
          </div>
          <div className="footer-links">
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
            <Link href="/faq" className="footer-link">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
