import SEOLandingPage from '../components/seo-landing-page';
import { buildMetadata } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['whatsapp-status-generator'];

export const metadata = buildMetadata({
  title: pageData.shortTitle,
  description: pageData.metaDescription,
  path: '/whatsapp-status-generator',
  keywords: ['WhatsApp status generator', 'status writer', 'short status ideas'],
});

export default function WhatsAppStatusGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
