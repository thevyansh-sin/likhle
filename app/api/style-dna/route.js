import { getStyleProfile, getStyleDNA } from '../generate/style-memory';
import { validateStyleDnaSessionKey } from '../../lib/request-validation';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const validation = validateStyleDnaSessionKey(searchParams.get('sessionKey'));

  if (!validation.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const profile = await getStyleProfile(validation.sessionKey);
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
