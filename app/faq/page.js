import InfoPageLayout from '../components/info-page-layout';
import { buildMetadata } from '../lib/site';

const faqItems = [
  {
    question: 'Is Likhle free to use?',
    answer: 'Right now, the product is positioned as a free tool. That can change later, but the current public experience is meant to be simple and accessible.',
  },
  {
    question: 'What kind of text can it write?',
    answer: 'Likhle can generate Instagram captions, bios, Reels hooks, WhatsApp statuses, LinkedIn bios, Twitter/X bios, and other short creator-focused writing formats.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No signup is required in the current version.',
  },
  {
    question: 'Can I upload images?',
    answer: 'Yes. The generator currently supports JPG, PNG, and WEBP image uploads up to 5 MB so the AI can understand the image context better.',
  },
  {
    question: 'Does Likhle save my recent generations?',
    answer: 'Recent history is stored locally in your browser, not presented as a permanent cloud account history.',
  },
  {
    question: 'Does it support Hinglish or Hindi-style writing?',
    answer: 'Yes. There is a Hinglish option and tone controls to make the output feel more natural for Indian creator use cases.',
  },
  {
    question: 'Can I trust the output blindly?',
    answer: 'No. AI output should always be reviewed before posting or using professionally because it can still be inaccurate, repetitive, or off-tone sometimes.',
  },
  {
    question: 'How do I report a bug or give feedback?',
    answer: 'Use the Contact page and include what happened, what you expected, and any error you saw.',
  },
];

export const metadata = buildMetadata({
  title: 'FAQ',
  description: 'Frequently asked questions about how Likhle works.',
  path: '/faq',
  keywords: ['Likhle FAQ', 'AI writing tool FAQ', 'caption generator questions'],
});

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <InfoPageLayout
      eyebrow="FAQ"
      title="Quick answers for common questions"
      description="This page gives users simple answers about pricing, uploads, history, output quality, and how the product works."
      updatedLabel="Last updated: March 20, 2026"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="info-faq-list">
        {faqItems.map((item) => (
          <section key={item.question} className="info-faq-card">
            <h2 className="info-faq-question">{item.question}</h2>
            <p className="info-text">{item.answer}</p>
          </section>
        ))}
      </div>
    </InfoPageLayout>
  );
}
