import { redis } from './rate-limit';

const STYLE_PROFILE_KEY_PREFIX = 'likhle:style:';
const UPDATE_WEIGHT = 0.35; // 35% weight to the new generation, 65% to historical
const HINGLISH_KEYWORDS = [
  'hai', 'kya', 'nahi', 'bhi', 'toh', 'ka', 'ki', 'tha', 'raha', 'se', 'tha', 'rha', 'hoga', 'mera', 'apna', 'tum', 'aap', 'yaar', 'bhai', 'behen', 'deshi', 'desi', 'mast', 'gazab'
];

/**
 * Extracts stylistic signals from one or more generation results.
 */
export function extractStyleSignals(results, selectedTone) {
  if (!Array.isArray(results) || results.length === 0) return null;

  let totalEmojiCount = 0;
  let totalHinglishCount = 0;
  let totalSentenceLength = 0;
  let totalLineBreaks = 0;
  let totalWords = 0;

  results.forEach(res => {
    const text = res.text || '';
    // Emoji detection (basic range)
    const emojis = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
    totalEmojiCount += emojis.length;

    // Hinglish detection
    const words = text.toLowerCase().split(/\s+/);
    totalWords += words.length;
    const hinglishWords = words.filter(w => HINGLISH_KEYWORDS.includes(w.replace(/[^a-z]/g, '')));
    totalHinglishCount += hinglishWords.length;

    // Structure
    const lineBreaks = (text.match(/\n/g) || []).length;
    totalLineBreaks += lineBreaks;

    // Length
    totalSentenceLength += text.length;
  });

  const count = results.length;
  return {
    emoji_density: totalEmojiCount / totalWords,
    hinglish_ratio: totalHinglishCount / totalWords,
    avg_length: totalSentenceLength / count,
    structure: totalLineBreaks / count > 0.5 ? 'multi-line' : 'single-line',
    preferred_tone: selectedTone,
    generation_count: 1
  };
}

/**
 * Fetches the user's style profile from Redis.
 */
export async function getStyleProfile(sessionKey) {
  if (!sessionKey || !redis) return null;

  try {
    const data = await redis.get(`${STYLE_PROFILE_KEY_PREFIX}${sessionKey}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch (err) {
    console.error('Error fetching style profile:', err);
    return null;
  }
}

/**
 * Updates the user's style profile with a weighted rolling average.
 */
export async function updateStyleProfile(sessionKey, results, selectedTone, rewriteAction) {
  if (!sessionKey || !redis || rewriteAction) return;

  try {
    const currentSignals = extractStyleSignals(results, selectedTone);
    if (!currentSignals) return;

    const existingProfile = await getStyleProfile(sessionKey);

    if (!existingProfile) {
      await redis.set(`${STYLE_PROFILE_KEY_PREFIX}${sessionKey}`, JSON.stringify({
        ...currentSignals,
        last_updated: Date.now()
      }));
      return;
    }

    // Weighted average for numerical values
    const newProfile = {
      emoji_density: (existingProfile.emoji_density * (1 - UPDATE_WEIGHT)) + (currentSignals.emoji_density * UPDATE_WEIGHT),
      hinglish_ratio: (existingProfile.hinglish_ratio * (1 - UPDATE_WEIGHT)) + (currentSignals.hinglish_ratio * UPDATE_WEIGHT),
      avg_length: (existingProfile.avg_length * (1 - UPDATE_WEIGHT)) + (currentSignals.avg_length * UPDATE_WEIGHT),
      structure: currentSignals.structure, // Structure often flips, use latest
      preferred_tone: selectedTone,
      generation_count: (existingProfile.generation_count || 0) + 1,
      last_updated: Date.now()
    };

    await redis.set(`${STYLE_PROFILE_KEY_PREFIX}${sessionKey}`, JSON.stringify(newProfile));
  } catch (err) {
    console.error('Error updating style profile:', err);
  }
}
