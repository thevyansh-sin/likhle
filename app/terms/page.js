import InfoPageLayout from '../components/info-page-layout';
import { buildMetadata } from '../lib/site';

export const metadata = buildMetadata({
  title: 'Terms of Use',
  description: 'The basic rules for using Likhle responsibly.',
  path: '/terms',
  keywords: ['terms of use', 'usage policy', 'AI tool terms'],
});

export default function TermsPage() {
  return (
    <InfoPageLayout
      eyebrow="Terms of Use"
      title="Simple rules for using Likhle"
      description="These terms explain what the service does, what you can expect from it, and how it should be used."
      updatedLabel="Last updated: March 20, 2026"
    >
      <section className="info-section">
        <h2 className="info-section-title">What the service is</h2>
        <p className="info-text">
          Likhle is an AI writing tool designed to help users generate captions, bios, status lines, hooks, and related text. The service may change, improve, slow down, or become unavailable at any time.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Using the service responsibly</h2>
        <ul className="info-list">
          <li>Do not use Likhle for illegal, abusive, hateful, deceptive, or harmful content.</li>
          <li>Do not upload content you do not have the right to use.</li>
          <li>Do not try to break the site, bypass limits, scrape the service aggressively, or abuse the API.</li>
          <li>Do not use the tool in a way that violates another person&apos;s privacy or rights.</li>
        </ul>
      </section>

      <section className="info-grid">
        <section className="info-card">
          <h2 className="info-card-title">AI output limits</h2>
          <p className="info-text">
            AI output can be wrong, repetitive, biased, incomplete, or similar to text that already exists elsewhere. You are responsible for reviewing the final output before you post, publish, or rely on it.
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-card-title">Your content</h2>
          <p className="info-text">
            You are responsible for the prompts and uploads you provide and for how you use the generated text. Likhle does not promise that outputs are exclusive, original, or legally risk-free for every use case.
          </p>
        </section>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Availability and changes</h2>
        <p className="info-text">
          The site is provided on an &quot;as available&quot; basis. Features may be added, removed, or changed without notice. Rate limits, safety controls, and usage restrictions may also be updated whenever needed to keep the service stable.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Suspension or blocking</h2>
        <p className="info-text">
          Likhle may restrict or block access to protect the service, prevent abuse, comply with law, or respond to misuse. This includes automated rate limiting and other safety measures.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">No warranties and limited liability</h2>
        <p className="info-text">
          Likhle is a lightweight internet product, not a guaranteed professional service. To the fullest extent allowed by law, the service is provided without warranties of uninterrupted availability, accuracy, suitability, or fitness for a particular purpose. Use it at your own discretion.
        </p>
      </section>

      <section className="info-note">
        These terms are a practical starter for the current product stage and should be reviewed again if you later add teams, subscriptions, accounts, or commercial licensing.
      </section>
    </InfoPageLayout>
  );
}
