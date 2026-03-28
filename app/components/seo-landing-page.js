import { headers } from 'next/headers';
import Link from 'next/link';
import { ideaPages } from '../idea-pages-data';
import { serializeJsonForHtmlScript } from '../lib/input-safety';
import { siteVersion, siteVersionPrefix } from '../lib/site';
import { seoPages } from '../seo-pages-data';
import ThemeToggle from './theme-toggle';

function buildFaqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export default async function SEOLandingPage({ page }) {
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') || undefined;
  const relatedPages = seoPages.filter((item) => item.slug !== page.slug).slice(0, 4);
  const relatedIdeaPages = ideaPages
    .filter((item) => item.relatedGeneratorSlugs?.includes(page.slug))
    .slice(0, 4);
  const faqSchema = buildFaqSchema(page);

  return (
    <main className="seo-page">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtmlScript(faqSchema) }}
      />

      <nav className="info-nav">
        <Link href="/" className="info-logo">likhle<span className="logo-dot">.</span></Link>
        <div className="info-nav-links">
          <Link href="/" className="info-nav-link">Home</Link>
          <Link href="/generate" className="info-nav-link">Generate</Link>
          <Link href="/faq" className="info-nav-link">FAQ</Link>
          <Link href="/contact" className="info-nav-link">Contact</Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="seo-hero" data-reveal>
        <div className="seo-hero-shell">
          <div className="seo-hero-copy" data-reveal data-reveal-delay="0.04s">
            <div className="seo-kicker">{page.eyebrow}</div>
            <h1 className="seo-title">{page.title}</h1>
            <p className="seo-description">{page.description}</p>

            <div className="seo-chip-row">
              <span className="seo-chip seo-chip-accent">{page.platform}</span>
              <span className="seo-chip">{page.defaultLength}</span>
              <span className="seo-chip">{page.defaultTone}</span>
              <span className="seo-chip">Free</span>
            </div>

            <div className="hero-actions">
              <Link
                href={{
                  pathname: '/generate',
                  query: {
                    platform: page.platform,
                    length: page.defaultLength,
                    tone: page.defaultTone,
                    prompt: page.promptIdeas[0],
                  },
                }}
                className="btn-primary"
              >
                Open the generator
              </Link>
              <a href="#prompt-ideas" className="btn-ghost">See prompt ideas</a>
            </div>
          </div>

          <div className="seo-preview-card" data-reveal data-reveal-delay="0.1s">
            <div className="seo-preview-head">Recommended setup</div>
            <div className="seo-preview-stack">
              <div className="seo-preview-item">
                <span className="seo-preview-label">Format</span>
                <span className="seo-preview-value">{page.platform}</span>
              </div>
              <div className="seo-preview-item">
                <span className="seo-preview-label">Recommended tone</span>
                <span className="seo-preview-value">{page.defaultTone}</span>
              </div>
              <div className="seo-preview-item">
                <span className="seo-preview-label">Best length</span>
                <span className="seo-preview-value">{page.defaultLength}</span>
              </div>
            </div>
            <p className="seo-preview-note">
              Start here, then adjust tone, length, or Hinglish in the main generator without rebuilding the setup.
            </p>
          </div>
        </div>
      </section>

      <div className="seo-shell">
        <section className="seo-highlight-grid" data-reveal>
          {page.highlights.map((item) => (
            <div key={item.title} className="seo-highlight-card" data-reveal data-reveal-delay="0.02s">
              <h2 className="seo-card-title">{item.title}</h2>
              <p className="seo-card-text">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="seo-section" id="prompt-ideas" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">Prompt ideas</span>
            <h2 className="section-title">Start faster with prompts that already fit this use case</h2>
            <p className="section-copy">
              Use one to open the generator with the right format already loaded.
            </p>
          </div>

          <div className="seo-prompt-grid">
            {page.promptIdeas.map((prompt) => (
              <Link
                key={prompt}
                href={{
                  pathname: '/generate',
                  query: {
                    platform: page.platform,
                    length: page.defaultLength,
                    tone: page.defaultTone,
                    prompt,
                  },
                }}
                className="seo-prompt-card"
                data-reveal
                data-reveal-delay="0.02s"
              >
                <span className="seo-card-kicker">Open in generator</span>
                <span className="seo-prompt-text">{prompt}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="seo-section" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">FAQ</span>
            <h2 className="section-title">Common questions about this generator</h2>
          </div>

          <div className="seo-faq-list">
            {page.faqs.map((item) => (
              <div key={item.question} className="seo-faq-card" data-reveal data-reveal-delay="0.02s">
                <h3 className="seo-card-title">{item.question}</h3>
                <p className="seo-card-text">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="seo-section" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">Related pages</span>
            <h2 className="section-title">Explore other writing surfaces</h2>
          </div>

          <div className="seo-related-grid">
            {relatedPages.map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="seo-related-card" data-reveal data-reveal-delay="0.02s">
                <span className="seo-card-kicker">Explore</span>
                <h3 className="seo-card-title">{item.shortTitle}</h3>
                <p className="seo-card-text">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {relatedIdeaPages.length > 0 ? (
          <section className="seo-section" data-reveal>
            <div className="seo-section-head">
              <span className="section-kicker">Idea guides</span>
              <h2 className="section-title">Need inspiration before generating?</h2>
              <p className="section-copy">
                These pages are more example-led, so they work well when you want a head start before opening the tool.
              </p>
            </div>

            <div className="seo-related-grid">
              {relatedIdeaPages.map((item) => (
                <Link key={item.slug} href={`/${item.slug}`} className="seo-related-card" data-reveal data-reveal-delay="0.02s">
                  <span className="seo-card-kicker">Idea guide</span>
                  <h3 className="seo-card-title">{item.shortTitle}</h3>
                  <p className="seo-card-text">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="seo-cta" data-reveal>
          <h2 className="cta-title">Ready to turn this into a post-ready line?</h2>
          <p className="cta-sub">
            Open the generator with this setup loaded, then adjust tone, length, and extras in one clean flow.
          </p>
          <Link
            href={{
              pathname: '/generate',
              query: {
                platform: page.platform,
                length: page.defaultLength,
                tone: page.defaultTone,
                prompt: page.promptIdeas[0],
              },
            }}
            className="btn-primary btn-lg"
          >
            Open this setup
          </Link>
        </section>
      </div>

      <footer className="info-footer">
        <div className="info-footer-links">
          <Link href="/" className="info-footer-link">Home</Link>
          <Link href="/generate" className="info-footer-link">Generate</Link>
          <Link href="/privacy" className="info-footer-link">Privacy</Link>
          <Link href="/terms" className="info-footer-link">Terms</Link>
          <Link href="/contact" className="info-footer-link">Contact</Link>
          <Link href="/faq" className="info-footer-link">FAQ</Link>
        </div>
        <div className="info-footer-note">
          <span>Each page is built around one real writing use case and routes straight into the live generator flow.</span>
          <span className="info-footer-version site-version-badge">
            <span className="site-version-prefix">{siteVersionPrefix}</span>
            <span className="site-version-number">{siteVersion}</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
