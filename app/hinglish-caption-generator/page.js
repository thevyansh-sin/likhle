import SEOLandingPage from '../components/seo-landing-page';
import { buildMetadata } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['hinglish-caption-generator'];

export const metadata = buildMetadata({
  title: pageData.shortTitle,
  description: pageData.metaDescription,
  path: '/hinglish-caption-generator',
  keywords: ['Hinglish caption generator', 'Indian caption generator', 'Hinglish Instagram captions'],
});

export default function HinglishCaptionGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
