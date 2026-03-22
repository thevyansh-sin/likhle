import Link from 'next/link';
import ThemeToggle from './components/theme-toggle';
import { ideaPages } from './idea-pages-data';
import { siteVersion, siteVersionPrefix } from './lib/site';
import { seoPages } from './seo-pages-data';

const heroProofItems = [
  {
    title: 'IG captions',
    note: 'seedha post-ready',
  },
  {
    title: 'Reels hooks',
    note: 'strong first lines',
  },
  {
    title: 'WhatsApp status',
    note: 'short aur usable',
  },
  {
    title: 'Hinglish mode',
    note: 'jab dono mix chahiye',
  },
];

const winCards = [
  {
    eyebrow: 'Format pehle',
    title: 'Pehle sahi format choose karo',
    desc: 'Captions, bios, hooks, aur statuses sab ek jaise nahi likhe jaate, isliye first pass hi zyada fit lagta hai.',
  },
  {
    eyebrow: 'Tone pe control',
    title: 'Generate se pehle vibe lock karo',
    desc: 'Tone, length, Hinglish, emojis, aur hashtags pehle set karo, taaki baad mein generic line ko rescue na karna pade.',
  },
  {
    eyebrow: 'Ek line sharpen karo',
    title: 'Sirf wahi line fix karo jo miss kar rahi ho',
    desc: 'Ek result weak lage toh ussi ko rewrite ya regenerate karo, baaki strong stack waise ka waisa rehta hai.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Scene batao',
    desc: 'Post ka scene, mood, ya intent daalo.',
  },
  {
    step: '02',
    title: 'Controls set karo',
    desc: 'Format, tone, length, aur extras pick karo.',
  },
  {
    step: '03',
    title: 'Best line uthao',
    desc: 'Copy karo, ek line rewrite karo, ya ek line refresh karo.',
  },
];

const outputExamples = [
  {
    useCase: 'Instagram caption',
    meta: 'Warm + Hinglish',
    text: 'late-night chai stop, overplayed playlist, aur woh random baat-cheet jo poora din theek kar de.',
  },
  {
    useCase: 'WhatsApp status',
    meta: 'Casual',
    text: 'aaj ka scene: kam noise, better company, full reset.',
  },
  {
    useCase: 'Reels hook',
    meta: 'POV opener',
    text: 'POV: ek quick chai stop poori raat ki memory ban gaya.',
  },
];

export default function Home() {
  return (
    <main className="main">
      <nav className="nav">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <div className="nav-links">
          <a href="#why-likhle" className="nav-link">Kyun Likhle</a>
          <a href="#real-output-proof" className="nav-link">Real lines</a>
          <a href="#idea-guides" className="nav-link">Idea guides</a>
          <ThemeToggle />
          <Link href="/generate" className="nav-cta">Generator kholo →</Link>
        </div>
      </nav>

      <section className="hero" data-reveal>
        <div className="hero-grid">
          <div className="hero-copy" data-reveal data-reveal-delay="0.04s">
            <div className="hero-badge">Gen Z India ke posting vibe ke liye built</div>
            <h1 className="hero-title">India ke posting vibe ko samajhne wala writing tool.</h1>
            <p className="hero-sub">
              Captions, bios, hooks, aur statuses. Platform, tone, length, Hinglish,
              hashtags, aur image vibe pe poora control.
            </p>
            <div className="hero-actions">
              <Link href="/generate" className="btn-primary">Likhna shuru karo</Link>
              <a href="#real-output-proof" className="btn-ghost">Real lines dekho</a>
            </div>

            <div className="hero-proof-grid">
              {heroProofItems.map((item) => (
                <div key={item.title} className="proof-card">
                  <span className="proof-card-title">{item.title}</span>
                  <span className="proof-card-note">{item.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel" data-reveal data-reveal-delay="0.1s">
            <div className="demo-card demo-card--hero">
              <div className="demo-topbar">
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-dot" />
                <span className="demo-status">Live scene</span>
              </div>

              <div className="demo-block">
                <span className="demo-label">Post ka scene</span>
                <p className="demo-text">Night drive + chai stop after coaching. Warm, postable, thoda Hinglish.</p>
              </div>

              <div className="demo-chip-row">
                <span className="demo-chip demo-chip-active">Instagram caption</span>
                <span className="demo-chip">Medium</span>
                <span className="demo-chip">Warm</span>
                <span className="demo-chip">Hinglish</span>
              </div>

              <div className="demo-result-card">
                <div className="demo-result-top">
                  <span className="demo-result-label">Post-ready line</span>
                  <span className="demo-result-score">Seedha post-ready</span>
                </div>
                <p className="demo-result-text">
                  late-night chai stop, overplayed playlist, aur woh random baat-cheet that fixes the whole day.
                </p>
              </div>

              <div className="demo-meta-row">
                <span className="demo-meta-pill">Ek line rewrite</span>
                <span className="demo-meta-pill">Ek line refresh</span>
                <span className="demo-meta-pill">Line copy karo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features features--homepage" id="why-likhle" data-reveal>
        <div className="section-header section-header--left section-header--compact">
          <span className="section-kicker">Kyun Likhle alag lagta hai</span>
          <h2 className="section-title">Posting ka real decision flow isi tarah chalta hai.</h2>
          <p className="section-copy section-copy--left">
            Format pehle, vibe lock uske baad, aur jo line miss kare sirf ussi ko fix karo.
          </p>
        </div>

        <div className="features-grid features-grid--three">
          {winCards.map((feature) => (
            <div key={feature.title} className="feature-card" data-reveal data-reveal-delay="0.02s">
              <span className="feature-eyebrow">{feature.eyebrow}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow workflow--quiet" id="how-it-works" data-reveal>
        <div className="section-header section-header--left section-header--compact">
          <span className="section-kicker">Kaise kaam karta hai</span>
          <h2 className="section-title">3 quick choices. Phir line tumhari.</h2>
          <p className="section-copy section-copy--left">
            Scene ek baar batao, controls set karo, aur strongest line utha lo.
          </p>
        </div>

        <div className="workflow-grid workflow-grid--quiet">
          {workflowSteps.map((item) => (
            <div key={item.step} className="workflow-card workflow-card--quiet" data-reveal data-reveal-delay="0.03s">
              <div className="workflow-step">{item.step}</div>
              <h3 className="workflow-title">{item.title}</h3>
              <p className="workflow-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="proof-section" id="real-output-proof" data-reveal>
        <div className="proof-shell">
          <div className="section-header section-header--left section-header--compact">
            <span className="section-kicker">Real output check</span>
            <h2 className="section-title">Achha output actually aisa lagta hai.</h2>
            <p className="section-copy section-copy--left">
              Short, believable, aur format-fit.
            </p>
          </div>

          <div className="proof-example-grid">
            {outputExamples.map((example) => (
              <div key={example.useCase} className="proof-example-card" data-reveal data-reveal-delay="0.02s">
                <div className="proof-example-top">
                  <span className="proof-example-label">{example.useCase}</span>
                  <span className="proof-example-meta">{example.meta}</span>
                </div>
                <p className="proof-example-text">{example.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="seo-links-section seo-links-section--home" id="popular-generators" data-reveal>
        <div className="section-header section-header--left section-header--compact">
          <span className="section-kicker">Popular generators</span>
          <h2 className="section-title">Jo kaam chahiye, ussi lane mein seedha kholo.</h2>
          <p className="section-copy section-copy--left">
            Format pata ho toh right lane mein start karo aur usable line tak faster pahuncho.
          </p>
        </div>

        <div className="seo-link-grid">
          {seoPages.slice(0, 4).map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className="seo-link-card" data-reveal data-reveal-delay="0.02s">
              <span className="seo-link-kicker">{page.eyebrow}</span>
              <h3 className="seo-link-title">{page.shortTitle}</h3>
              <p className="seo-link-desc">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="idea-links-section idea-links-section--home" id="idea-guides" data-reveal>
        <div className="section-header section-header--left section-header--compact">
          <span className="section-kicker">Idea guides</span>
          <h2 className="section-title">Examples chahiye? Guides se start karo.</h2>
          <p className="section-copy section-copy--left">
            Example-heavy pages browse karo, phir fresh versions chahiye ho toh matching generator kholo.
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

      <section className="cta-section cta-section--home" data-reveal>
        <div className="cta-shell cta-shell--home">
          <div className="cta-copy-block">
            <h2 className="cta-title">Better likho, faster likho, aur zyada control ke saath.</h2>
            <p className="cta-sub">
              Likhle kholo aur rough idea se post-ready line tak ek hi flow mein jao.
            </p>
          </div>
          <Link href="/generate" className="btn-primary btn-lg">Likhna shuru karo</Link>
        </div>
      </section>

      <footer className="footer">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <div className="footer-stack">
          <div className="footer-meta">
            <span className="footer-text">India mein bana, Gen Z India ke liye.</span>
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
