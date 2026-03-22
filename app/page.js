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
    title: 'Start from a post-shaped prompt',
    desc: 'Open with built-in setups like Goa sunset, birthday dump, gym transformation, study hook, or wedding carousel instead of typing from zero every time.',
  },
  {
    eyebrow: 'Precision',
    title: 'Choose the output before the writing',
    desc: 'Instagram caption, bio, Reels hook, WhatsApp status, LinkedIn bio, or Twitter/X bio. Likhle starts in the right lane instead of guessing after the fact.',
  },
  {
    eyebrow: 'Control',
    title: 'Dial the density before you generate',
    desc: 'Pick short, medium, or long so the first pass already feels closer to your post instead of asking you to trim generic fluff later.',
  },
  {
    eyebrow: 'Speed',
    title: 'Refresh the weak line, not the whole set',
    desc: 'If two directions feel close and one misses, regenerate that one card and keep the rest intact.',
  },
  {
    eyebrow: 'Memory',
    title: 'Recent drafts stay within reach',
    desc: 'Likhle keeps your latest generations in browser history so the good lines stay nearby instead of disappearing after one tab switch.',
  },
  {
    eyebrow: 'Visual',
    title: 'Use the photo as context, not decoration',
    desc: 'Upload a photo, preview it first, and let the writing pick up the mood, setting, and energy before the words start.',
  },
  {
    eyebrow: 'Desktop',
    title: 'Paste screenshots straight into the box',
    desc: 'On desktop, copy a screenshot and hit Ctrl+V inside the prompt area to attach it instantly without extra menu work.',
  },
  {
    eyebrow: 'Rewrite',
    title: 'Refine a single line in place',
    desc: 'Make one result shorter, sharper, softer, more professional, or more Hinglish without resetting the rest of the stack.',
  },
  {
    eyebrow: 'Output',
    title: 'Take the draft and move',
    desc: 'Copy one result, copy the full set, or download the stack as text without bouncing between notes, tabs, and screenshots.',
  },
];
const workflowSteps = [
  {
    step: '01',
    title: 'Describe the post, not the prompt',
    desc: 'Write one clear line about the photo, mood, audience, or page you are trying to post.',
  },
  {
    step: '02',
    title: 'Lock the format and tone',
    desc: 'Choose platform, length, vibe, and extras like Hinglish, emojis, or hashtags before the first output lands.',
  },
  {
    step: '03',
    title: 'Polish the strongest direction',
    desc: 'Copy, refine, regenerate one option, or reopen the full stack later from recent history.',
  },
];
const proofCards = ['Platform-aware drafts', 'Image-aware + Hinglish-ready', 'Recent drafts stay saved', 'Refine one card, not all'];

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

      <section className="hero" data-reveal>
        <div className="hero-grid">
          <div className="hero-copy" data-reveal data-reveal-delay="0.04s">
            <div className="hero-badge">Built for Indian posts, profiles, and side-hustles</div>
            <h1 className="hero-title">
              Write
              <br />
              <span className="word-swap" style={{ opacity: visible ? 1 : 0 }}>
                {words[wordIndex]}
              </span>
              <br />
              that sound posted, not prompted
            </h1>
            <p className="hero-sub">
              Prompt likho. Platform choose karo. Vibe lock karo.
              <br />
              Likhle turns that into cleaner, post-ready writing without the generic AI residue.
            </p>
            <div className="hero-actions">
              <Link href="/generate" className="btn-primary">Try the live generator →</Link>
              <a href="#features" className="btn-ghost">See the flow</a>
            </div>
            <div className="hero-note">Free • No signup • Hinglish-ready • Recent drafts stay saved</div>

            <div className="hero-proof-grid">
              {proofCards.map((card) => (
                <div key={card} className="proof-card">{card}</div>
              ))}
            </div>
          </div>

          <div className="hero-panel" data-reveal data-reveal-delay="0.1s">
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

      <section className="features" id="features" data-reveal>
        <div className="section-header">
          <span className="section-kicker">What is inside</span>
          <h2 className="section-title">A sharper writing workflow, not just another caption box</h2>
          <p className="section-copy">
            More control before generation, cleaner output after it, and fewer annoying repeat steps in between.
          </p>
        </div>

        <div className="features-grid">
          {featureCards.map((feature) => (
            <div key={feature.title} className="feature-card" data-reveal data-reveal-delay="0.02s">
              <span className="feature-eyebrow">{feature.eyebrow}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" data-reveal>
        <span className="section-divider-line" />
        <span className="section-divider-core" />
        <span className="section-divider-line" />
      </div>

      <section className="seo-links-section" data-reveal>
        <div className="section-header">
          <span className="section-kicker">Popular Generators</span>
          <h2 className="section-title">Open the right generator path without wandering first</h2>
          <p className="section-copy">
            These pages match real search intent and drop people straight into the generator setup that fits the job.
          </p>
        </div>

        <div className="seo-link-grid">
          {seoPages.map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className="seo-link-card" data-reveal data-reveal-delay="0.02s">
              <span className="seo-link-kicker">{page.eyebrow}</span>
              <h3 className="seo-link-title">{page.shortTitle}</h3>
              <p className="seo-link-desc">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" data-reveal>
        <span className="section-divider-line" />
        <span className="section-divider-core" />
        <span className="section-divider-line" />
      </div>

      <section className="idea-links-section" data-reveal>
        <div className="section-header">
          <span className="section-kicker">Idea Guides</span>
          <h2 className="section-title">Example-heavy idea pages for people who already know the mood</h2>
          <p className="section-copy">
            These pages lead with real examples, then open the matching generator setup when someone wants fresher variations.
          </p>
        </div>

        <div className="seo-related-grid">
          {ideaPages.slice(0, 4).map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className="seo-related-card" data-reveal data-reveal-delay="0.02s">
              <span className="seo-card-kicker">{page.eyebrow}</span>
              <h3 className="seo-card-title">{page.shortTitle}</h3>
              <p className="seo-card-text">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" data-reveal>
        <span className="section-divider-line" />
        <span className="section-divider-core" />
        <span className="section-divider-line" />
      </div>

      <section className="workflow" id="workflow" data-reveal>
        <div className="section-header">
          <span className="section-kicker">How it works</span>
          <h2 className="section-title">Three small choices, then the writing gets sharper fast</h2>
          <p className="section-copy">
            The product should feel direct: describe the post, lock the controls, then keep only the line worth posting.
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((item) => (
            <div key={item.step} className="workflow-card" data-reveal data-reveal-delay="0.03s">
              <div className="workflow-step">{item.step}</div>
              <h3 className="workflow-title">{item.title}</h3>
              <p className="workflow-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" data-reveal>
        <span className="section-divider-line" />
        <span className="section-divider-core" />
        <span className="section-divider-line" />
      </div>

      <section className="cta-section" data-reveal>
        <div className="cta-shell">
          <h2 className="cta-title">Ready to turn a rough vibe into something worth posting?</h2>
          <p className="cta-sub">
            Whether it is a trip dump caption, LinkedIn bio, WhatsApp status, or Reels hook, Likhle keeps the writing tighter and the workflow calmer.
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
