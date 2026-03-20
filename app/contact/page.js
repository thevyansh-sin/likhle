import InfoPageLayout from '../components/info-page-layout';

const PUBLIC_CONTACT_EMAIL = 'likhlesupport@gmail.com';
const INSTAGRAM_HANDLE = '@likhle.in';
const INSTAGRAM_URL = 'https://instagram.com/likhle.in';

export const metadata = {
  title: 'Contact | Likhle',
  description: 'How to reach Likhle for support, bug reports, and feedback.',
};

export default function ContactPage() {
  return (
    <InfoPageLayout
      eyebrow="Contact"
      title="Reach out about bugs, feedback, or partnerships"
      description="If something breaks, feels confusing, or you want to collaborate, this is the page users should check first."
      updatedLabel="Last updated: March 20, 2026"
    >
      <div className="info-grid">
        <section className="info-card">
          <h2 className="info-card-title">Best way to contact</h2>
          <p className="info-text">
            Email: <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} className="info-inline-link">{PUBLIC_CONTACT_EMAIL}</a>
          </p>
          <p className="info-text">
            Instagram: <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="info-inline-link">{INSTAGRAM_HANDLE}</a>
          </p>
          <p className="info-text">
            You can use this for support questions, feedback, partnerships, bug reports, takedown requests, or general product suggestions.
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-card-title">When to use this page</h2>
          <ul className="info-list">
            <li>A result looked broken or confusing.</li>
            <li>An upload or generation flow failed repeatedly.</li>
            <li>You found something unsafe, abusive, or inappropriate.</li>
            <li>You want to suggest a feature or collaboration idea.</li>
          </ul>
        </section>
      </div>

      <section className="info-section">
        <h2 className="info-section-title">Helpful details to include</h2>
        <ul className="info-list">
          <li>What you were trying to do.</li>
          <li>What actually happened.</li>
          <li>Any error message you saw.</li>
          <li>Your device or browser if the issue looks technical.</li>
        </ul>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">Response expectations</h2>
        <p className="info-text">
          Because Likhle is a lean product, response times may vary. Feedback and bug reports are still valuable even if a reply is not immediate.
        </p>
      </section>
    </InfoPageLayout>
  );
}
