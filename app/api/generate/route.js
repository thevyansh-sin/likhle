import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt({ input, tone, hinglish, emoji, hashtags }) {
  const langNote = hinglish
    ? 'Write in Hinglish (natural mix of Hindi and English, like how Gen Z Indians actually talk).'
    : 'Write STRICTLY in English only. Do not use any Hindi words at all.';
  const emojiNote = emoji ? 'Include relevant emojis naturally.' : 'Do not use emojis.';
  const hashtagNote = hashtags ? 'Add 5-8 relevant hashtags at the end if it is a caption.' : 'Do not add hashtags.';

  return `You are Likhle, an AI writing assistant made for Gen Z Indian creators.

The user will describe what they want in plain language. You must:
1. Automatically understand what type of content they need (Instagram caption, bio, WhatsApp status, Twitter bio, LinkedIn bio, YouTube description, Reels hook, POV caption etc.)
2. Write in the tone they described or use this tone: ${tone}
3. Make it feel authentic and Gen Z

User's request: ${input}

${langNote}
${emojiNote}
${hashtagNote}

Rules:
- Write 4 different versions, each distinctly different
- Understand the platform and format automatically from the user's description
- Keep it genuine, not corporate or AI-generated
- Use Indian cultural references naturally when relevant
- DO NOT number the versions or add labels
- Separate each version with exactly: ---SPLIT---
- Write ONLY the content, nothing else

Write the 4 versions now:`;
}

function buildPrompt({ input, tone, contentType, hinglish, emoji, hashtags }) {
  const typeLabel = typePrompts[contentType] || 'Instagram caption';
  const langNote = hinglish
    ? 'Write in Hinglish (a natural mix of Hindi and English, like how Gen Z Indians actually talk — e.g. "yaar this is insane", "sach mein amazing tha").'
    : 'Write in English.';
  const emojiNote = emoji ? 'Include relevant emojis naturally.' : 'Do not use emojis.';
  const hashtagNote = hashtags && contentType === 'instagram_caption'
    ? 'Add 5-8 relevant hashtags at the end.'
    : 'Do not add hashtags.';

  return `You are Likhle, an AI writing assistant made for Gen Z Indian creators. You write captions, bios, and social media content that feels authentic, trendy, and resonates with Indian youth culture.

Task: Write 4 different versions of a ${typeLabel}.

Topic/Context: ${input}
Tone: ${tone}
${langNote}
${emojiNote}
${hashtagNote}

Rules:
- Each version should be distinctly different (not just synonyms)
- Keep the ${tone} tone consistently
- Make it feel genuine, not corporate or AI-generated
- For Indian-specific references, use them naturally (festivals, food, cricket, Bollywood etc.) ONLY if relevant
- DO NOT number the versions or add labels
- Separate each version with exactly this separator: ---SPLIT---
- Write ONLY the content, no explanations

Write the 4 versions now:`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { input, tone, hinglish, emoji, hashtags } = body;

    if (!input?.trim()) {
      return Response.json({ error: 'Input required' }, { status: 400 });
    }

    const prompt = buildPrompt({ input, tone, hinglish, emoji, hashtags });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const results = raw
      .split('---SPLIT---')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

    return Response.json({ results });
  } catch (err) {
    console.error('Groq error:', err);
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }
}