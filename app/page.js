import Link from 'next/link';
import ThemeToggle from './components/theme-toggle';
import { ideaPages } from './idea-pages-data';
import { siteVersion, siteVersionPrefix } from './lib/site';
import { seoPages } from './seo-pages-data';

const heroProofItems = [
  {
    title: 'Instagram captions',
    note: 'post-ready lines',
  },
  {
    title: 'Reels hooks',
    note: 'strong first opens',
  },
  {
    title: 'WhatsApp statuses',
    note: 'short and usable',
  },
  {
    title: 'Hinglish-ready',
    note: 'when the line needs both',
  },
];

const winCards = [
  {
    eyebrow: 'Format first',
    title: 'Start with the right format',
    desc: 'Likhle writes differently for captions, bios, hooks, and statuses so the first pass already feels shaped for the job.',
  },
  {
    eyebrow: 'Controls before output',
    title: 'Control the tone before generating',
    desc: 'Pick vibe, length, Hinglish, emojis, and hashtags before the writing starts instead of fixing generic output afterward.',
  },
  {
    eyebrow: 'Refine one line',
    title: 'Refine only what needs work',
    desc: 'Rewrite or regenerate one result without losing the rest, so the stack stays useful while one line gets sharper.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Describe the post',
    desc: 'Give the scene, mood, or intent.',
  },
  {
    step: '02',
    title: 'Set the controls',
    desc: 'Pick format, tone, length, and extras.',
  },
  {
    step: '03',
    title: 'Take the best line',
    desc: 'Copy it, rewrite one, or regenerate one.',
  },
];

const outputExamples = [
  {
    useCase: 'Instagram caption',
    meta: 'Warm + Hinglish',
    text: 'late-night chai stop, overplayed playlist, aur woh random baat-cheet that fixes the whole day.',
  },
  {
    useCase: 'WhatsApp status',
    meta: 'Casual',
    text: 'aaj ka scene: less noise, better company, full reset.',
  },
  {
    useCase: 'Reels hook',
    meta: 'POV opener',
    text: 'POV: one quick chai stop turned into the whole memory of the night.',
  },
];

export default function Home() {
  return (
    <main className="main">
      <nav className="nav">
        <span className="logo">likhle<span className="logo-dot">.</span></span>
        <div className="nav-links">
          <a href="#why-likhle" className="nav-link">Why Likhle</a>
          <a href="#real-output-proof" className="nav-link">Real outputs</a>
          <a href="#idea-guides" className="nav-link">Idea guides</a>
          <ThemeToggle />
          <Link href="/generate" className="nav-cta">Open the generator →</Link>
        </div>
      </nav>

      <section className="hero" data-reveal>
        <div className="hero-grid">
          <div className="hero-copy" data-reveal data-reveal-delay="0.04s">
            <div className="hero-badge">Built for how India actually posts</div>
            <h1 className="hero-title">The writing tool for how India actually posts.</h1>
            <p className="hero-sub">
              Captions, bios, hooks, and statuses with control over platform, tone, length,
              Hinglish, hashtags, and image context.
            </p>
            <div className="hero-actions">
              <Link href="/generate" className="btn-primary">Open the generator</Link>
              <a href="#real-output-proof" className="btn-ghost">See real outputs</a>
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
                <span className="demo-status">Generator preview</span>
              </div>

              <div className="demo-block">
                <span className="demo-label">Describe the post</span>
                <p className="demo-text">Night drive + chai stop after coaching. Warm, postable, slightly Hinglish.</p>
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
                  <span className="demo-result-score">Ready to post</span>
                </div>
                <p className="demo-result-text">
                  late-night chai stop, overplayed playlist, aur woh random baat-cheet that fixes the whole day.
                </p>
              </div>

              <div className="demo-meta-row">
                <span className="demo-meta-pill">Rewrite one</span>
                <span className="demo-meta-pill">Regenerate one</span>
                <span className="demo-meta-pill">Copy line</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features features--homepage" id="why-likhle" data-reveal>
        <div className="section-header section-header--left section-header--compact">
          <span className="section-kicker">Why Likhle wins</span>
          <h2 className="section-title">Built to match how posting decisions actually happen.</h2>
          <p className="section-copy section-copy--left">
            Pick the format, lock the tone, then refine only the line that misses. The workflow stays useful because the control comes first.
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
          <span className="section-kicker">How it works</span>
          <h2 className="section-title">Three small choices. Then the line is yours.</h2>
          <p className="section-copy section-copy--left">
            Describe the post once, set the controls, and take the strongest line.
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
            <span className="section-kicker">Real output proof</span>
            <h2 className="section-title">What good output actually sounds like.</h2>
            <p className="section-copy section-copy--left">
              Short, believable, and shaped for the format you picked.
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
          <h2 className="section-title">Open the generator already pointed at the job.</h2>
          <p className="section-copy section-copy--left">
            If you already know the format, start in the right lane and get to the usable line faster.
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
          <h2 className="section-title">Need examples first? Start with the guides.</h2>
          <p className="section-copy section-copy--left">
            Browse example-heavy pages, then open the matching generator when you want fresher versions.
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
            <h2 className="cta-title">Write better, faster, and with more control.</h2>
            <p className="cta-sub">
              Open Likhle and go from rough idea to post-ready line in one flow.
            </p>
          </div>
          <Link href="/generate" className="btn-primary btn-lg">Open the generator</Link>
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
