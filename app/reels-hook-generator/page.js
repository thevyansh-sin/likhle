import SEOLandingPage from '../components/seo-landing-page';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['reels-hook-generator'];

export const metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
};

export default function ReelsHookGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
