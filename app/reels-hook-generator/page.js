import SEOLandingPage from '../components/seo-landing-page';
import { buildMetadata } from '../lib/site';
import { seoPagesBySlug } from '../seo-pages-data';

const pageData = seoPagesBySlug['reels-hook-generator'];

export const metadata = buildMetadata({
  title: pageData.shortTitle,
  description: pageData.metaDescription,
  path: '/reels-hook-generator',
  keywords: ['Reels hook generator', 'Instagram Reels hook', 'short video hook ideas'],
});

export default function ReelsHookGeneratorPage() {
  return <SEOLandingPage page={pageData} />;
}
