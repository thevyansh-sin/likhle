import { notFound } from 'next/navigation';
import IdeaLandingPage from '../components/idea-landing-page';
import { ideaPages, ideaPagesBySlug } from '../idea-pages-data';
import { buildMetadata } from '../lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return ideaPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = ideaPagesBySlug[slug];

  if (!page) {
    return {};
  }

  return buildMetadata({
    title: page.shortTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    keywords: page.keywords || [],
  });
}

export default async function IdeaPage({ params }) {
  const { slug } = await params;
  const page = ideaPagesBySlug[slug];

  if (!page) {
    notFound();
  }

  return <IdeaLandingPage page={page} />;
}
