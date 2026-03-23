import { getStyleProfile, getStyleDNA } from '../generate/style-memory';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionKey = searchParams.get('sessionKey');

  if (!sessionKey) {
    return Response.json({ error: 'Missing sessionKey' }, { status: 400 });
  }

  try {
    const profile = await getStyleProfile(sessionKey);
    const dna = getStyleDNA(profile);

    if (!dna) {
      return Response.json({ dna: null });
    }

    return Response.json({ dna });
  } catch (error) {
    console.error('Style DNA fetch error:', error);
    return Response.json({ error: 'Failed to fetch style DNA' }, { status: 500 });
  }
}
