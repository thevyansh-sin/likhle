import Link from 'next/link';
import { ideaPages } from '../idea-pages-data';
import { siteVersion, siteVersionPrefix } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';
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

function buildItemListSchema(page) {
  const items = page.ideaGroups.flatMap((group) => group.items);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.shortTitle,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item,
    })),
  };
}

function buildGeneratorQuery(page, prompt) {
  return {
    platform: page.platform,
    length: page.defaultLength,
    tone: page.defaultTone,
    prompt,
    hinglish: page.options?.hinglish ? 'true' : 'false',
    emoji: page.options?.emoji ? 'true' : 'false',
    hashtags: page.options?.hashtags ? 'true' : 'false',
  };
}

function buildIdeaPrompt(page, idea) {
  return `Create 4 fresh ${page.platform.toLowerCase()} options inspired by this line: "${idea}". Keep the vibe ${page.defaultTone.toLowerCase()}, but make the writing original and post-ready.`;
}

export default function IdeaLandingPage({ page }) {
  const faqSchema = buildFaqSchema(page);
  const itemListSchema = buildItemListSchema(page);
  const ideaCount = page.ideaGroups.reduce((count, group) => count + group.items.length, 0);
  const relatedIdeaPages = ideaPages.filter((item) => item.slug !== page.slug).slice(0, 4);
  const relatedGenerators = (page.relatedGeneratorSlugs || [])
    .map((slug) => seoPagesBySlug[slug])
    .filter(Boolean);

  return (
    <main className="seo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
              <span className="seo-chip">{ideaCount} ideas</span>
              <span className="seo-chip seo-chip-accent">{page.platform}</span>
              <span className="seo-chip">{page.defaultLength}</span>
              <span className="seo-chip">{page.defaultTone}</span>
              {page.options?.hinglish ? <span className="seo-chip">Hinglish on</span> : null}
            </div>

            <div className="hero-actions">
              <Link
                href={{
                  pathname: '/generate',
                  query: buildGeneratorQuery(page, page.promptIdeas[0]),
                }}
                className="btn-primary"
              >
                Open This Setup
              </Link>
              <a href="#ideas" className="btn-ghost">Browse ideas</a>
            </div>
          </div>

          <div className="seo-preview-card" data-reveal data-reveal-delay="0.1s">
            <div className="seo-preview-head">How to use this page</div>
            <div className="seo-preview-stack">
              <div className="seo-preview-item">
                <span className="seo-preview-label">1</span>
                <span className="seo-preview-value">Pick a line that matches your post mood</span>
              </div>
              <div className="seo-preview-item">
                <span className="seo-preview-label">2</span>
                <span className="seo-preview-value">Open it in the generator with the right setup</span>
              </div>
              <div className="seo-preview-item">
                <span className="seo-preview-label">3</span>
                <span className="seo-preview-value">Make it more personal instead of copy-pasting blind</span>
              </div>
            </div>
            <p className="seo-preview-note">{page.intro}</p>
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

        <section className="seo-section" id="ideas" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">Idea list</span>
            <h2 className="section-title">{ideaCount} starting lines, grouped by vibe</h2>
            <p className="section-copy">
              Each one opens directly in Likhle, so you can turn a rough idea into fresher options instead of copying the exact same sentence.
            </p>
          </div>

          <div className="idea-group-grid">
            {page.ideaGroups.map((group) => (
              <div key={group.title} className="idea-group-card" data-reveal data-reveal-delay="0.02s">
                <div className="idea-group-head">
                  <h3 className="idea-group-title">{group.title}</h3>
                  <p className="idea-group-copy">{group.description}</p>
                </div>

                <div className="idea-list">
                  {group.items.map((idea, index) => (
                    <Link
                      key={idea}
                      href={{
                        pathname: '/generate',
                        query: buildGeneratorQuery(page, buildIdeaPrompt(page, idea)),
                      }}
                      className="idea-link"
                    >
                      <span className="idea-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="idea-link-copy">
                        <span className="idea-line">{idea}</span>
                        <span className="idea-note">Open in generator</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="seo-section" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">Prompt ideas</span>
            <h2 className="section-title">Start from a cleaner prompt if you want brand-new options</h2>
            <p className="section-copy">
              These prompts already match the right use case, tone, and platform so the generator does less guessing.
            </p>
          </div>

          <div className="seo-prompt-grid">
            {page.promptIdeas.map((prompt) => (
              <Link
                key={prompt}
                href={{
                  pathname: '/generate',
                  query: buildGeneratorQuery(page, prompt),
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

        {relatedGenerators.length > 0 ? (
          <section className="seo-section" data-reveal>
            <div className="seo-section-head">
              <span className="section-kicker">Related generators</span>
              <h2 className="section-title">Use the matching tool when you want fresh variations</h2>
            </div>

            <div className="seo-related-grid">
              {relatedGenerators.map((item) => (
                <Link key={item.slug} href={`/${item.slug}`} className="seo-related-card" data-reveal data-reveal-delay="0.02s">
                  <span className="seo-card-kicker">Generator</span>
                  <h3 className="seo-card-title">{item.shortTitle}</h3>
                  <p className="seo-card-text">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="seo-section" data-reveal>
          <div className="seo-section-head">
            <span className="section-kicker">FAQ</span>
            <h2 className="section-title">Common questions about these idea pages</h2>
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
            <span className="section-kicker">More idea pages</span>
            <h2 className="section-title">Keep exploring other specific writing moods</h2>
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

        <section className="seo-cta" data-reveal>
          <h2 className="cta-title">Want fresh versions instead of a fixed list?</h2>
          <p className="cta-sub">
            Open the generator with this exact use case already set up, then make the output more personal, more sharp, more soft, or more Hinglish.
          </p>
          <Link
            href={{
              pathname: '/generate',
              query: buildGeneratorQuery(page, page.promptIdeas[0]),
            }}
            className="btn-primary btn-lg"
          >
            Generate from this idea set
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
          <span>These idea pages are meant to be useful on their own and even better when connected to the main generator.</span>
          <span className="info-footer-version site-version-badge">
            <span className="site-version-prefix">{siteVersionPrefix}</span>
            <span className="site-version-number">{siteVersion}</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
