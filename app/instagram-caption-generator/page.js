import SEOLandingPage from '../components/seo-landing-page';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['instagram-caption-generator'];

export const metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
};

export default function InstagramCaptionGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
