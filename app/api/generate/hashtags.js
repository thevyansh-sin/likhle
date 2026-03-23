export const MIN_REQUIRED_HASHTAGS = 4;
export const MAX_REQUIRED_HASHTAGS = 6;

const HASHTAG_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'after', 'all', 'another', 'at', 'bio', 'caption', 'captions',
  'cheesy', 'clean', 'credible', 'create', 'day', 'during', 'everyone', 'for', 'from',
  'have', 'human', 'hook', 'hooks', 'image', 'in', 'instagram', 'is', 'it', 'its',
  'just', 'keep', 'late', 'like', 'linkedin', 'long', 'loud', 'make', 'medium', 'midnight',
  'my', 'night', 'not', 'now', 'photo', 'post', 'posts', 'posting', 'quiet', 'really',
  'reactions', 'reels', 'scroll', 'short', 'sound', 'status', 'stopping', 'strong',
  'student', 'semester', 'that', 'the', 'their', 'this', 'too', 'twitter', 'use', 'want',
  'warm', 'was', 'whatsapp', 'with', 'wrong', 'write', 'your'
]);

const WEAK_SINGLE_WORD_HASHTAGS = new Set([
  'bio', 'caption', 'captions', 'fun', 'hook', 'hooks', 'life', 'mood', 'moment',
  'moments', 'pick', 'post', 'posts', 'proving', 'ready', 'story', 'stories', 'thing',
  'things', 'vibe', 'vibes'
]);

const SEMANTIC_HASHTAG_RULES = [
  { test: /\bgoa\b/i, tags: ['GoaDiaries', 'GoaVibes'] },
  { test: /\b(sunset|golden hour|sun down)\b/i, tags: ['GoldenHour', 'SunsetMood'] },
  { test: /\b(beach|sea|ocean|coast|shore)\b/i, tags: ['BeachVibes', 'CoastalMood'] },
  { test: /\b(travel|trip|road trip|vacation|vacay)\b/i, tags: ['TravelDiaries', 'TripMood'] },
  { test: /\b(mountain|hills|trek|trekking)\b/i, tags: ['MountainMood', 'WanderMood'] },
  { test: /\b(rain|rainy|monsoon)\b/i, tags: ['RainyMood', 'MonsoonVibes'] },
  { test: /\b(chai|coffee|cafe)\b/i, tags: ['CafeScenes', 'ChaiTime'] },
  { test: /\b(birthday|bday)\b/i, tags: ['BirthdayPost', 'BirthdayVibes'] },
  { test: /\b(best friend|bestie|friends|squad)\b/i, tags: ['BestieEnergy', 'SquadMoments'] },
  { test: /\b(gym|fitness|workout|transformation)\b/i, tags: ['GymLife', 'FitnessJourney'] },
  { test: /\b(study|exam|college|notes)\b/i, tags: ['StudyMode', 'ExamSeason'] },
  { test: /\b(reels|hook|scroll)\b/i, tags: ['ScrollStopper', 'ReelsHook'] },
  { test: /\b(linkedin|career|placement|job|internship)\b/i, tags: ['CareerUpdate', 'LinkedInPost'] },
  { test: /\b(whatsapp|status)\b/i, tags: ['StatusUpdate', 'MoodLine'] },
  { test: /\b(wedding|shaadi|bride|baraat)\b/i, tags: ['WeddingDump', 'ShaadiVibes'] },
  { test: /\b(cricket|match|watch party)\b/i, tags: ['CricketNight', 'MatchMood'] },
  { test: /\b(love|romantic|anniversary|date)\b/i, tags: ['SoftMoments', 'LoveNotes'] },
  { test: /\b(diwali)\b/i, tags: ['DiwaliNights', 'FestivalGlow'] },
  { test: /\b(holi)\b/i, tags: ['HoliVibes', 'ColorSplash'] },
  { test: /\b(photo dump|dump)\b/i, tags: ['PhotoDump', 'DumpDiary'] },
  { test: /\b(party|night out|club|dance floor|celebrate)\b/i, tags: ['PartyNight', 'NightOutMood'] },
  { test: /\b(outfit|ootd|fit check|fashion)\b/i, tags: ['OutfitCheck', 'StyleMood'] },
  { test: /\b(food|foodie|dessert|dinner|lunch|brunch)\b/i, tags: ['FoodieMoments', 'EatRepeat'] },
  { test: /\b(startup|build|launch|shipping|project)\b/i, tags: ['BuildInPublic', 'LaunchMode'] },
  { test: /\b(sad|heartbreak|missing|alone|healing)\b/i, tags: ['LateNightFeels', 'SadHours'] },
];

const SEMANTIC_HASHTAG_KEYWORD_GROUPS = [
  { keywords: ['selfie', 'portrait'], tags: ['SelfieMood', 'FaceCard'] },
  { keywords: ['night', 'late'], tags: ['LateNightMood'] },
  { keywords: ['girl', 'girls'], tags: ['GirlsNight'] },
  { keywords: ['boy', 'boys'], tags: ['BoysNight'] },
  { keywords: ['glow', 'glowup'], tags: ['GlowUpCheck'] },
  { keywords: ['roadtrip', 'road'], tags: ['RoadTripMode'] },
  { keywords: ['beach', 'wave'], tags: ['BeachDay'] },
  { keywords: ['sunset', 'golden'], tags: ['SunsetLover'] },
  { keywords: ['study', 'library'], tags: ['CampusDiary'] },
  { keywords: ['career', 'internship'], tags: ['CareerMoves'] },
];

export function extractExistingHashtags(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return Array.from(value.matchAll(/#[A-Za-z0-9_]+/g)).map((match) => match[0]);
}

export function toHashtagLabel(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const cleanedValue = value.replace(/[^A-Za-z0-9]+/g, ' ').trim();
  if (!cleanedValue) {
    return '';
  }
  return cleanedValue
    .split(/\s+/)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function collectHashtagTokens(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function collectHashtagKeywords(value) {
  return collectHashtagTokens(value)
    .filter((word) => word.length >= 3 && !HASHTAG_STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

export function collectHashtagPhrases(value) {
  const meaningfulTokens = collectHashtagTokens(value).filter(
    (word) =>
      word.length >= 4 &&
      !HASHTAG_STOP_WORDS.has(word) &&
      !WEAK_SINGLE_WORD_HASHTAGS.has(word) &&
      !/^\d+$/.test(word)
  );
  const phrases = [];
  for (let index = 0; index < meaningfulTokens.length - 1; index += 1) {
    phrases.push(`${meaningfulTokens[index]} ${meaningfulTokens[index + 1]}`);
  }
  return Array.from(new Set(phrases)).slice(0, 8);
}

export function isWeakHashtagLabel(label) {
  if (typeof label !== 'string') {
    return true;
  }
  const normalizedLabel = label.replace(/^#/, '');
  const splitWords = normalizedLabel.match(/[A-Z]?[a-z0-9]+/g)?.map((word) => word.toLowerCase()) || [];
  return splitWords.length === 1 && WEAK_SINGLE_WORD_HASHTAGS.has(splitWords[0]);
}

export function getFallbackToneHashtags(tone) {
  return {
    Aesthetic: ['AestheticMood'],
    Funny: ['FunnyEnergy'],
    Savage: ['SavageMode'],
    Motivational: ['MotivationDaily'],
    Romantic: ['SoftMoments'],
    Professional: ['CareerReady'],
    Desi: ['DesiMood'],
  }[tone] || ['GenZIndia'];
}

export function getFallbackPlatformHashtags(platform) {
  return {
    'Instagram Caption': ['InstagramPost'],
    'Instagram Bio': ['InstagramBio'],
    'Reels Hook': ['ReelsHook'],
    'WhatsApp Status': ['StatusUpdate'],
    'LinkedIn Bio': ['LinkedInPost'],
    'Twitter/X Bio': ['TwitterBio'],
    'Auto Detect': ['PostReady'],
  }[platform] || ['PostReady'];
}

export function getSemanticHashtagCandidates({ input, imageDescription, platform, tone }) {
  const contextText = `${input || ''}\n${imageDescription || ''}`.toLowerCase();
  const contextKeywords = new Set([
    ...collectHashtagKeywords(input),
    ...collectHashtagKeywords(imageDescription || ''),
  ]);
  const semanticTags = [];

  for (const rule of SEMANTIC_HASHTAG_RULES) {
    if (rule.test.test(contextText)) {
      semanticTags.push(...rule.tags);
    }
  }

  for (const group of SEMANTIC_HASHTAG_KEYWORD_GROUPS) {
    if (group.keywords.some((keyword) => contextKeywords.has(keyword))) {
      semanticTags.push(...group.tags);
    }
  }

  semanticTags.push(...getFallbackToneHashtags(tone));
  semanticTags.push(...getFallbackPlatformHashtags(platform));
  semanticTags.push('GenZIndia', 'LikhlePick');

  return Array.from(new Set(semanticTags));
}

export function buildHashtagFinish({ input, text, tone, platform, imageDescription }) {
  const existingHashtags = extractExistingHashtags(text).filter((hashtag) => !isWeakHashtagLabel(hashtag));
  const seenHashtags = new Set(existingHashtags.map((item) => item.toLowerCase()));
  const nextHashtags = [...existingHashtags];
  const candidatePhrases = Array.from(
    new Set([
      ...collectHashtagPhrases(input),
      ...collectHashtagPhrases(imageDescription || ''),
    ])
  );
  const orderedCandidates = [
    ...getSemanticHashtagCandidates({ input, imageDescription, platform, tone }),
    ...candidatePhrases,
  ];

  for (const candidate of orderedCandidates) {
    const nextLabel = toHashtagLabel(candidate);
    if (!nextLabel || nextLabel.length < 3 || isWeakHashtagLabel(nextLabel)) {
      continue;
    }
    const nextHashtag = `#${nextLabel}`;
    const signature = nextHashtag.toLowerCase();
    if (seenHashtags.has(signature)) {
      continue;
    }
    seenHashtags.add(signature);
    nextHashtags.push(nextHashtag);
    if (nextHashtags.length >= MAX_REQUIRED_HASHTAGS) {
      break;
    }
  }

  return nextHashtags.slice(0, MAX_REQUIRED_HASHTAGS);
}

export function ensureHashtagFinish({ text, hashtags, input, tone, platform, imageDescription }) {
  if (!hashtags || typeof text !== 'string' || !text.trim()) {
    return text;
  }
  const hashtagList = buildHashtagFinish({ input, text, tone, platform, imageDescription });
  if (hashtagList.length < MIN_REQUIRED_HASHTAGS) {
    return text;
  }
  const baseText = text.replace(/(\s*#[A-Za-z0-9_]+)+\s*$/g, '').trim();
  return `${baseText}\n${hashtagList.join(' ')}`.trim();
}
