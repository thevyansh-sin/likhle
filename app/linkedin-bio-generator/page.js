import SEOLandingPage from '../components/seo-landing-page';
import { buildMetadata } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['linkedin-bio-generator'];

export const metadata = buildMetadata({
  title: pageData.shortTitle,
  description: pageData.metaDescription,
  path: '/linkedin-bio-generator',
  keywords: ['LinkedIn bio generator', 'LinkedIn summary writer', 'professional bio generator'],
});

export default function LinkedInBioGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
