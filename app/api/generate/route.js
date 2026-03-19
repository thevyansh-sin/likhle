import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const typePrompts = {
  instagram_caption: 'Instagram caption (with line breaks if needed)',
  instagram_bio: 'Instagram bio (max 150 chars, punchy)',
  twitter_bio: 'Twitter/X bio (max 160 chars)',
  linkedin_bio: 'LinkedIn bio (professional but interesting, 2-3 lines)',
  youtube_desc: 'YouTube video description (2-3 paragraphs)',
  whatsapp_status: 'WhatsApp status (short, impactful, under 60 chars)',
  reels_hook: 'Instagram Reels hook — first 3 seconds spoken text (attention-grabbing, makes people stop scrolling)',
  pov_caption: 'POV-style Instagram caption (starts with "POV:")',
};

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
    const { input, tone, contentType, hinglish, emoji, hashtags } = body;

    if (!input?.trim()) {
      return Response.json({ error: 'Input required' }, { status: 400 });
    }

    const prompt = buildPrompt({ input, tone, contentType, hinglish, emoji, hashtags });

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