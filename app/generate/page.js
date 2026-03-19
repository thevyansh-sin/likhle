'use client';
import { useState } from 'react';
import Link from 'next/link';

const PLACEHOLDERS = [
  "Gym ke baad selfie, feeling pumped 💪",
  "Beach sunset with besties, golden hour vibes",
  "New outfit drop, feeling myself fr fr",
  "Late night study grind, chai in hand ☕",
  "Cricket match jeet gaye, dil khush hai 🏏",
  "Goa trip with gang, best days ever 🌊",
  "Diwali night, lights everywhere ✨",
  "First day of college, nervous but excited",
  "Rainy day mood, window seat aur coffee",
  "Road trip on NH, windows down, music loud 🎵",
  "Eid ka chand dekha, dil roshan ho gaya 🌙",
  "Birthday surprise from best friend, crying happy tears 🎂",
  "First salary aaya, treat toh banta hai 💸",
  "Mountains trip, cold wind aur hot maggi ⛰️",
  "Holi ke rang, yaar ke sang 🎨",
  "New haircut, new me energy fr",
  "Exam khatam, ab toh freedom 🎉",
  "Late night drive, city lights aur lofi music 🌃",
  "Mom ke haath ka khana, nothing hits different 🍱",
  "First time driving alone, felt so independent 🚗",
  "Graduation day, 4 saal ki mehnat 🎓",
  "Solo cafe date, me time is everything ☕",
  "New year ki raat, dost aur fireworks 🎆",
  "Morning run done, endorphins hitting hard 🏃",
  "Baarish mein bheega, zero regrets 🌧️",
  "IPL final dekha live, kya raat thi 🏏",
  "Street food with bestie, gol gappe round 2 🥘",
  "Sunset from terrace, city looks beautiful 🌇",
  "Internship ka pehla din, nervous but ready 💼",
  "Siblings ka pyaar, thoda nok jhok bhi 😄",
];

const TONES = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const CONTENT_TYPES = [
  { label: '📸 Instagram Caption', value: 'instagram_caption' },
  { label: '👤 Instagram Bio', value: 'instagram_bio' },
  { label: '🐦 Twitter Bio', value: 'twitter_bio' },
  { label: '💼 LinkedIn Bio', value: 'linkedin_bio' },
  { label: '▶️ YouTube Description', value: 'youtube_desc' },
  { label: '💬 WhatsApp Status', value: 'whatsapp_status' },
  { label: '🎬 Reels Hook', value: 'reels_hook' },
  { label: '🤳 POV Caption', value: 'pov_caption' },
];

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  const [tone, setTone] = useState('Aesthetic');
  const [contentType, setContentType] = useState('instagram_caption');
  const [hinglish, setHinglish] = useState(false);
  const [emoji, setEmoji] = useState(true);
  const [hashtags, setHashtags] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [dark, setDark] = useState(true);
  const [error, setError] = useState('');

  const t = {
    bg: dark ? '#080808' : '#F5F5F0',
    navBg: dark ? 'rgba(8,8,8,0.85)' : 'rgba(245,245,240,0.85)',
    text: dark ? '#f0f0f0' : '#111111',
    muted: dark ? '#888888' : '#666666',
    border: dark ? '#222222' : '#E0DED8',
    toneBg: dark ? '#1a1a1a' : '#EFEFEB',
    toneBorder: dark ? '#333333' : '#D8D6D0',
    toneText: dark ? '#888888' : '#555555',
    inputBg: dark ? '#1a1a1a' : '#FAFAF8',
    inputBorder: dark ? '#333333' : '#D8D6D0',
    inputText: dark ? '#f0f0f0' : '#111111',
    toggleBg: dark ? '#1a1a1a' : '#E8E6E0',
    toggleText: dark ? '#f0f0f0' : '#111111',
    resultBg: dark ? '#111111' : '#FFFFFF',
    resultBorder: dark ? '#222222' : '#E8E6E0',
    copyBg: dark ? '#1a1a1a' : '#F0EEE8',
    copyText: dark ? '#888888' : '#666666',
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResults([]);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, tone, contentType, hinglish, emoji, hashtags }),
      });
      const data = await res.json();
      if (data.results) setResults(data.results);
      else setError('Kuch gadbad ho gayi 😅 Try again!');
    } catch {
      setError('Server se connection nahi hua. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'all 0.3s', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100, background: t.navBg, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: -1, color: t.text, textDecoration: 'none' }}>
          likhle<span style={{ color: '#CAFF00' }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: t.muted }}>AI Caption Generator</span>
          <button onClick={() => setDark(!dark)} style={{ background: t.toggleBg, border: `1px solid ${t.border}`, borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontSize: 13, color: t.toggleText, fontWeight: 500, transition: 'all 0.2s' }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: -2, color: t.text, marginBottom: 8 }}>Kya likhna hai? ✍️</h1>
          <p style={{ fontSize: 16, color: t.muted }}>Apna idea daalo — Likhle baki sambhal leta hai.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Your Idea</label>
            <textarea style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 12, color: t.inputText, fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '16px 20px', resize: 'vertical', minHeight: 100, outline: 'none', width: '100%', transition: 'border-color 0.2s' }} placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} rows={3} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Content Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {CONTENT_TYPES.map((ct) => (
                <button key={ct.value} onClick={() => setContentType(ct.value)} style={{ background: contentType === ct.value ? 'rgba(202,255,0,0.08)' : t.toneBg, border: `1px solid ${contentType === ct.value ? 'rgba(202,255,0,0.4)' : t.toneBorder}`, borderRadius: 10, color: contentType === ct.value ? '#CAFF00' : t.toneText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s', fontWeight: contentType === ct.value ? 500 : 400 }}>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tone / Vibe</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TONES.map((tn) => (
                <button key={tn} onClick={() => setTone(tn)} style={{ background: tone === tn ? '#CAFF00' : t.toneBg, border: `1px solid ${tone === tn ? '#CAFF00' : t.toneBorder}`, color: tone === tn ? '#000' : t.toneText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 16px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s', fontWeight: tone === tn ? 700 : 400 }}>
                  {tn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Options</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[{ label: 'Hinglish mode 🇮🇳', val: hinglish, set: setHinglish }, { label: 'Add emojis ✨', val: emoji, set: setEmoji }, { label: 'Add hashtags #', val: hashtags, set: setHashtags }].map(({ label, val, set }) => (
                <div key={label} onClick={() => set(!val)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${val ? '#CAFF00' : t.toneBorder}`, background: val ? '#CAFF00' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#000', transition: 'all 0.15s' }}>{val ? '✓' : ''}</div>
                  <span style={{ fontSize: 14, color: val ? t.text : t.muted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !input.trim()} style={{ background: '#CAFF00', color: '#000', fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, padding: 16, border: 'none', borderRadius: 12, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'all 0.2s', letterSpacing: -0.5 }}>
            {loading ? 'Likh raha hai...' : 'Likhle! 🚀'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: t.muted, fontSize: 15 }}>
            <div>AI likh raha hai... ✨</div>
            <div style={{ display: 'inline-flex', gap: 6, marginTop: 12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, background: '#CAFF00', borderRadius: '50%', animation: `bounce 1s infinite ${i*0.15}s` }} />)}
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 24, color: '#FF2D78', fontSize: 14, textAlign: 'center' }}>{error}</div>}

        {results.length > 0 && (
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text, marginBottom: 8 }}>Yeh lo {results.length} options 🔥</div>
            {results.map((r, i) => (
              <div key={i} style={{ background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 14, padding: 20, position: 'relative' }}>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: t.text, whiteSpace: 'pre-wrap', paddingRight: 40 }}>{r}</p>
                <button onClick={() => handleCopy(r, i)} style={{ position: 'absolute', top: 14, right: 14, background: copied === i ? 'rgba(202,255,0,0.1)' : t.copyBg, border: `1px solid ${copied === i ? '#CAFF00' : t.resultBorder}`, color: copied === i ? '#CAFF00' : t.copyText, fontSize: 12, padding: '5px 12px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}>
                  {copied === i ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap'); @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );
}