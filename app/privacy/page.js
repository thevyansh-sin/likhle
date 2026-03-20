import InfoPageLayout from '../components/info-page-layout';
import { buildMetadata } from '../lib/site';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'How Likhle handles prompts, images, analytics, and browser-stored history.',
  path: '/privacy',
  keywords: ['privacy policy', 'AI privacy', 'prompt privacy'],
});

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Privacy Policy"
      title="How Likhle handles your data"
      description="This page explains what information Likhle may process when you use the website, why it is used, and what stays only in your browser."
      updatedLabel="Last updated: March 20, 2026"
    >
      <div className="info-grid">
        <section className="info-card">
          <h2 className="info-card-title">What we collect</h2>
          <ul className="info-list">
            <li>Prompts you type into the generator.</li>
            <li>Optional images you upload to help generate better results.</li>
            <li>Basic technical and usage data such as browser, device, approximate location signals, and page interactions through analytics tools.</li>
            <li>Recent generation history saved locally in your browser if you use that feature.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-card-title">What stays in your browser</h2>
          <p className="info-text">
            Your recent generation history is saved using browser storage on your own device so you can reopen past results later. That local history is not meant to be a permanent cloud backup and can be cleared from your browser at any time.
          </p>
        </section>
      </div>

      <section className="info-section">
        <h2 className="info-section-title">How your information is used</h2>
        <ul className="info-list">
          <li>To generate captions, bios, hooks, and other text outputs you request.</li>
          <li>To analyze uploaded images so the generated text matches the image context more closely.</li>
          <li>To keep the site secure, reduce abuse, and manage rate limiting.</li>
          <li>To understand site usage and improve the product experience over time.</li>
        </ul>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Third-party services</h2>
        <p className="info-text">
          Likhle currently uses third-party AI and analytics services to operate the product. Depending on the feature you use, prompts and optional images may be processed by AI providers to generate output, and site usage information may be measured using analytics tools. You should avoid sharing highly sensitive personal information, confidential documents, payment data, or private identifiers in prompts or uploads.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Analytics and cookies</h2>
        <p className="info-text">
          Likhle uses Google Analytics to understand traffic and product usage patterns. Analytics providers may use cookies or similar technologies for measurement and reporting. If you prefer, you can limit cookies through your browser settings or use browser controls that reduce tracking.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Retention</h2>
        <p className="info-text">
          Likhle does not present itself as a long-term cloud storage product. Local browser history remains on your device until you clear it. Server, hosting, analytics, and AI providers may retain logs or request data for limited operational, safety, debugging, or legal reasons under their own policies.
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Your choices</h2>
        <ul className="info-list">
          <li>Do not upload sensitive or confidential images or text.</li>
          <li>Clear browser storage if you do not want local history saved on the device.</li>
          <li>Limit cookies and analytics through your browser settings where available.</li>
          <li>Stop using the service if you do not agree with this policy.</li>
        </ul>
      </section>

      <section className="info-note">
        This is a practical starter privacy policy for the current product setup and should be reviewed again if you add accounts, payments, newsletters, or broader data collection.
      </section>
    </InfoPageLayout>
  );
}
