import SEOLandingPage from '../components/seo-landing-page';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['whatsapp-status-generator'];

export const metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
};

export default function WhatsAppStatusGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
