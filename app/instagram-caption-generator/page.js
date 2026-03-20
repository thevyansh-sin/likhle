import SEOLandingPage from '../components/seo-landing-page';
import { buildMetadata } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['instagram-caption-generator'];

export const metadata = buildMetadata({
  title: pageData.shortTitle,
  description: pageData.metaDescription,
  path: '/instagram-caption-generator',
  keywords: ['Instagram caption generator', 'Instagram captions', 'caption ideas'],
});

export default function InstagramCaptionGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
