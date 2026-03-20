import SEOLandingPage from '../components/seo-landing-page';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['linkedin-bio-generator'];

export const metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
};

export default function LinkedInBioGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
