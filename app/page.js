 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './components/theme-toggle';
import { siteVersion, siteVersionPrefix } from './lib/site';

const words = ['Captions', 'Bios', 'Hooks', 'Statuses', 'Hinglish lines'];
const marqueeItems = [
  'Exact Format First ✦',
  'Tone Control ✦',
  'Image Reference ✦',
  'Quick Templates ✦',
  'Regenerate One ✦',
  'Browser History ✦',
  'Download Text ✦',
  'Hinglish Mode ✦',
  'No Signup ✦',
  'Post-Ready Output ✦',
];
const featureCards = [
  {
    eyebrow: 'Start faster',
    title: 'Blank prompt se seedha first draft tak',
    desc: 'Quick templates hand you the opening setup, so you are not inventing the scene from scratch every time.',
  },
  {
    eyebrow: 'Stay on-format',
    title: 'Caption maango toh caption hi milta hai',
    desc: 'Pick the format first so captions, bios, hooks, and statuses stop bleeding into the wrong output type.',
  },
  {
    eyebrow: 'Match the photo',
    title: 'Image ke vibe ke saath line aati hai',
    desc: 'Add a reference image and the caption lands closer to the real post instead of a generic mood guess.',
  },
  {
    eyebrow: 'Fix one result',
    title: 'Ek off line ke liye batch dubara nahi',
    desc: 'Refresh the weak card only and keep the good options that were already working.',
  },
  {
    eyebrow: 'Keep what worked',
    title: 'Jo usable tha, woh browser mein rehta hai',
    desc: 'Recent history keeps strong ideas close, so a good line is still there when you come back later.',
  },
  {
    eyebrow: 'Take it out fast',
    title: 'Copy karo, download karo, aur done',
    desc: 'Lift one result or the full set without moving your workflow into Notes, chats, or another tab.',
  },
];
const workflowSteps = [
  {
    step: '01',
    title: 'Describe the post',
    desc: 'Photo dump ho, reel ho, ya bio update. Seedha bolo kis cheez ke liye line chahiye.',
  },
  {
    step: '02',
    title: 'Lock the vibe',
    desc: 'Format, tone, length, Hinglish, emojis, hashtags, aur image reference pehle set karo.',
  },
  {
    step: '03',
    title: 'Take the line that works',
    desc: 'Best result copy karo, weak one regenerate karo, ya baad mein history se reopen karo.',
  },
];
const proofCards = [
  {
    title: 'Exact format first',
    note: 'Caption, bio, hook, ya status. Output wrong lane mein nahi girta.',
  },
  {
    title: 'Image-aware lines',
    note: 'Photo ka mood pehle pakdo, fir caption zyada close aata hai.',
  },
  {
    title: 'Regenerate just one',
    note: 'Ek weak option refresh karo, poora batch dobara mat ghumaao.',
  },
  {
    title: 'No signup, history saved',
    note: 'Good lines browser mein rehti hain, account banane ka wait nahi.',
  },
];
const generatorCards = [
  {
    href: '/instagram-caption-generator',
    kicker: 'Photo posts',
    title: 'Instagram captions',
    desc: 'For dumps, travel posts, birthdays, cafe shots, aur everyday posting jo caption maangta hai.',
  },
  {
    href: '/reels-hook-generator',
    kicker: 'Short-form video',
    title: 'Reels hooks',
    desc: 'For edits, tutorials, POVs, and opening lines that need to stop the scroll faster.',
  },
  {
    href: '/whatsapp-status-generator',
    kicker: 'Mood drops',
    title: 'WhatsApp statuses',
    desc: 'For one-liners, late-night thoughts, soft flexes, and daily chaos updates.',
  },
  {
    href: '/hinglish-caption-generator',
    kicker: 'Local tone',
    title: 'Hinglish captions',
    desc: 'For lines that should sound natural, local, and not like forced Hindi-English.',
  },
  {
    href: '/linkedin-bio-generator',
    kicker: 'Professional intro',
    title: 'LinkedIn bios',
    desc: 'For students, freshers, creators, and builders who need a cleaner introduction.',
  },
];
const ideaGuideCards = [
  {
    href: '/50-savage-instagram-caption-ideas',
    kicker: 'Savage mood',
    title: 'Savage captions',
    desc: 'For low-effort attitude, clean boundaries, and slightly rude energy that still reads well.',
  },
  {
    href: '/hinglish-caption-ideas',
    kicker: 'Local vibe',
    title: 'Hinglish caption ideas',
    desc: 'For lines that should feel casual, Indian, and actually usable in a real post.',
  },
  {
    href: '/birthday-caption-ideas',
    kicker: 'Soft or hype',
    title: 'Birthday captions',
    desc: 'For best-friend posts, family dumps, main-character birthdays, ya low-key wishes.',
  },
  {
    href: '/100-whatsapp-status-ideas',
    kicker: 'Daily mood',
    title: 'Status ideas',
    desc: 'For funny, tired, overthinking, romantic, and late-night status energy.',
  },
];

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
            <div className="hero-badge">🇮🇳 Built for how India actually posts</div>
            <h1 className="hero-title">
              Write
              <br />
              <span className="word-swap" style={{ opacity: visible ? 1 : 0 }}>
                {words[wordIndex]}
              </span>
              <br />
              the way India actually posts.
            </h1>
            <p className="hero-sub">
              Caption, bio, hook, status, ya Hinglish line. Format, vibe, length, aur image reference pehle set karo,
              phir output lo jo actually postable lage.
            </p>
            <div className="hero-actions">
              <Link href="/generate" className="btn-primary">Likhle →</Link>
              <a href="#features" className="btn-ghost">See what&apos;s new</a>
            </div>
            <div className="hero-note">Free • No signup • Browser history saved • Regenerate one result</div>

            <div className="hero-proof-grid">
              {proofCards.map((card) => (
                <div key={card.title} className="proof-card">
                  <span className="proof-card-title">{card.title}</span>
                  <span className="proof-card-note">{card.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel" data-reveal data-reveal-delay="0.1s">
            <div className="demo-card">
              <div className="demo-topbar">
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-status">Actual creator flow</span>
              </div>

              <div className="demo-block">
                <span className="demo-label">Prompt + photo</span>
                <p className="demo-text">Delhi cafe photo dump. Thoda witty, thoda Hinglish, bilkul try-hard nahi.</p>
              </div>

              <div className="demo-chip-row">
                <span className="demo-chip demo-chip-active">Instagram caption</span>
                <span className="demo-chip">Short</span>
                <span className="demo-chip">Witty tone</span>
              </div>

              <div className="demo-result-card">
                <div className="demo-result-top">
                  <div className="demo-result-label">Post-ready output</div>
                  <div className="demo-result-score">Hinglish on</div>
                </div>
                <p className="demo-result-text">
                  good coffee, louder laughs, aur Delhi ki woh evening jo camera roll mein rehne layak thi.
                  <br />
                  bas enough chaos for a dump, not enough for drama.
                </p>
              </div>

              <div className="demo-meta-row">
                <span className="demo-meta-pill">Regenerate one</span>
                <span className="demo-meta-pill">Copy caption</span>
                <span className="demo-meta-pill">Save to recent</span>
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
        <div className="section-header section-header--compact">
          <span className="section-kicker">What changed</span>
          <h2 className="section-title">Six changes that get you to a usable line faster</h2>
          <p className="section-copy">
            Less guesswork up front, better context from the post, and way less wasted rework once something is already close.
          </p>
        </div>

        <div className="features-grid features-grid--three">
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

      <section className="seo-links-section seo-links-section--home" data-reveal>
        <div className="section-header section-header--compact">
          <span className="section-kicker">Popular Generators</span>
          <h2 className="section-title">Open the exact generator you need first</h2>
          <p className="section-copy">
            If you already know the format, jump straight into the right lane instead of starting from scratch.
          </p>
        </div>

        <div className="seo-link-grid seo-link-grid--home">
          {generatorCards.map((card) => (
            <Link key={card.href} href={card.href} className="seo-link-card" data-reveal data-reveal-delay="0.02s">
              <span className="seo-link-kicker">{card.kicker}</span>
              <h3 className="seo-link-title">{card.title}</h3>
              <p className="seo-link-desc">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" data-reveal>
        <span className="section-divider-line" />
        <span className="section-divider-core" />
        <span className="section-divider-line" />
      </div>

      <section className="idea-links-section idea-links-section--home" data-reveal>
        <div className="section-header section-header--compact">
          <span className="section-kicker">Idea Guides</span>
          <h2 className="section-title">Pick a mood and start from there</h2>
          <p className="section-copy">
            Use these when you already know the vibe and just need a sharper starting point.
          </p>
        </div>

        <div className="seo-related-grid">
          {ideaGuideCards.map((card) => (
            <Link key={card.href} href={card.href} className="seo-related-card" data-reveal data-reveal-delay="0.02s">
              <span className="seo-card-kicker">{card.kicker}</span>
              <h3 className="seo-card-title">{card.title}</h3>
              <p className="seo-card-text">{card.desc}</p>
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
        <div className="section-header section-header--compact">
          <span className="section-kicker">How it works</span>
          <h2 className="section-title">Describe it, tune it, keep the line</h2>
          <p className="section-copy">
            The flow is quick on purpose: tell Likhle what the post is, lock the vibe, and take the result that feels worth posting.
          </p>
        </div>

        <div className="workflow-grid workflow-grid--quiet">
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

      <section className="cta-section cta-section--home" data-reveal>
        <div className="cta-shell cta-shell--home">
          <div className="cta-copy-block">
            <h2 className="cta-title">One rough idea se post-ready line tak.</h2>
            <p className="cta-sub">
              Generator kholo, vibe set karo, aur jo line kaam ki lage usko seedha le jao.
            </p>
          </div>
          <Link href="/generate" className="btn-primary btn-lg">Try it free →</Link>
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
