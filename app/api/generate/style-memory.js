import { redis } from './rate-limit';
import { hashAnonymousSessionId } from '../../lib/anonymous-session';
import { parseStyleProfileRecord } from '../../lib/request-validation';

const STYLE_PROFILE_KEY_PREFIX = 'likhle:style:';
const STYLE_PROFILE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const UPDATE_WEIGHT = 0.35; // 35% weight to the new generation, 65% to historical
const HINGLISH_KEYWORDS = [
  'hai', 'kya', 'nahi', 'bhi', 'toh', 'ka', 'ki', 'tha', 'raha', 'se', 'tha', 'rha', 'hoga', 'mera', 'apna', 'tum', 'aap', 'yaar', 'bhai', 'behen', 'deshi', 'desi', 'mast', 'gazab'
];

function getStyleProfileKey(sessionId) {
  return `${STYLE_PROFILE_KEY_PREFIX}${hashAnonymousSessionId(sessionId)}`;
}

/**
 * Extracts stylistic signals from one or more generation results.
 */
export function extractStyleSignals(results, selectedTone) {
  if (!Array.isArray(results) || results.length === 0) return null;
  const eligibleResults = results
    .filter((res) => typeof res?.text === 'string' && res.text.trim())
    .slice(0, 3);

  if (eligibleResults.length === 0) {
    return null;
  }

  let totalEmojiCount = 0;
  let totalHinglishCount = 0;
  let totalSentenceLength = 0;
  let totalLineBreaks = 0;
  let totalWords = 0;

  eligibleResults.forEach((res) => {
    const text = res.text.slice(0, 1200);
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

  if (!totalWords) {
    return null;
  }

  const count = eligibleResults.length;
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
    const data = await redis.get(getStyleProfileKey(sessionKey));
    if (!data) {
      return null;
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return parseStyleProfileRecord(parsedData);
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
      await redis.set(getStyleProfileKey(sessionKey), JSON.stringify({
        ...currentSignals,
        last_updated: Date.now()
      }), { px: STYLE_PROFILE_TTL_MS });
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

    await redis.set(getStyleProfileKey(sessionKey), JSON.stringify(newProfile), { px: STYLE_PROFILE_TTL_MS });
  } catch (err) {
    console.error('Error updating style profile:', err);
  }
}
/**
 * Transforms raw profile data into human-readable Style DNA labels and a vibe summary.
 */
export function getStyleDNA(profile) {
  if (!profile || (profile.generation_count || 0) < 3) return null;

  const { emoji_density, hinglish_ratio, avg_length, structure, preferred_tone } = profile;

  // Language mapping
  let languageLabel = 'English Leaning';
  if (hinglish_ratio > 0.45) languageLabel = 'Hinglish Heavy';
  else if (hinglish_ratio > 0.15) languageLabel = 'Balanced';

  // Emoji mapping
  let emojiLabel = 'Minimal';
  if (emoji_density > 0.18) emojiLabel = 'Emoji Heavy';
  else if (emoji_density > 0.06) emojiLabel = 'Expressive';

  // Structure mapping
  let lengthLabel = 'Short Punchlines';
  if (avg_length > 180) lengthLabel = 'Long Form';
  else if (avg_length > 85) lengthLabel = 'Balanced';

  const structureLabel = structure === 'multi-line' ? 'Structured Paragraphs' : 'Clean Single Line';

  // Vibe Summary generation
  const summaries = {
    Aesthetic: (hinglish) => hinglish ? 'desi aesthetic wave' : 'silent flex energy',
    Savage: (hinglish) => hinglish ? 'hardcore desi savage' : 'clinical savage energy',
    Hinglish: () => 'pure local main character',
    Professional: () => 'sharp corporate flex',
    Funny: () => 'natural wit presence',
    Motivational: () => 'high octane energy',
    Romantic: () => 'soft poet energy',
  };

  const vibeBase = summaries[preferred_tone] || (() => 'unique writer identity');
  const vibeSummary = vibeBase(hinglish_ratio > 0.3);

  return {
    tone: preferred_tone,
    language: languageLabel,
    emoji: emojiLabel,
    length: lengthLabel,
    structure: structureLabel,
    vibe: vibeSummary,
    generationCount: profile.generation_count
  };
}
