'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const words = ['Captions', 'Bios', 'Hooks', 'Hashtags', 'Status'];

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="main">
      {/* Nav */}
      <nav className="nav">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <Link href="/generate" className="nav-cta">Try it free →</Link>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🇮🇳 Made for Indian Creators</div>
        <h1 className="hero-title">
          AI-powered
          <br />
          <span className="word-swap" style={{ opacity: visible ? 1 : 0 }}>
            {words[wordIndex]}
          </span>
          <br />
          for Gen Z India
        </h1>
        <p className="hero-sub">
          Type your vibe. Likhle writes the caption. <br />
          Hinglish, savage, aesthetic — aap chuno.
        </p>
        <div className="hero-actions">
          <Link href="/generate" className="btn-primary">Likhna shuru karo 🚀</Link>
          <a href="#features" className="btn-ghost">See features</a>
        </div>
        <div className="hero-note">Free • No signup • Works in Hindi + English</div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap">
        <div className="marquee">
          {['Instagram Captions ✦', 'Hinglish Mode ✦', 'Bio Builder ✦', 'Hashtag Gen ✦', 'Tone Detector ✦', 'Emoji Suggester ✦', 'POV Generator ✦', 'Reels Hooks ✦', 'Desi Humor Mode ✦', 'Instagram Captions ✦', 'Hinglish Mode ✦', 'Bio Builder ✦', 'Hashtag Gen ✦', 'Tone Detector ✦', 'Emoji Suggester ✦', 'POV Generator ✦', 'Reels Hooks ✦', 'Desi Humor Mode ✦'].map((item, i) => (
            <span key={i} className="marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="features" id="features">
        <h2 className="section-title">Sab kuch ek jagah 🤌</h2>
        <div className="features-grid">
          {[
            { icon: '✍️', title: 'Caption Generator', desc: '5 variations. Funny, aesthetic, savage — jo chaaho.' },
            { icon: '🧠', title: 'Hinglish Mode', desc: 'Pure desi vibes. Hindi + English mix jaise hona chahiye.' },
            { icon: '🎯', title: 'Tone Detector', desc: 'AI samajhta hai aapka mood. Auto tone match.' },
            { icon: '#️⃣', title: 'Hashtag Gen', desc: 'Niche-specific hashtags. More reach, less effort.' },
            { icon: '👤', title: 'Bio Builder', desc: 'Instagram, LinkedIn, Twitter — sab ke liye.' },
            { icon: '🎬', title: 'Reels Hook Writer', desc: 'First 3 seconds matter. Likhle handles it.' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to go viral? 🔥</h2>
        <p className="cta-sub">Join thousands of Indian creators using Likhle</p>
        <Link href="/generate" className="btn-primary btn-lg">Start for free →</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <span className="footer-text">Built by Manya Class 12th for Gen Z India</span>
      </footer>
    </main>
  );
}