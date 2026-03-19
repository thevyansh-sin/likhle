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
    <div className="gen-wrap" style={{background: dark ? '#080808' : '#F5F5F0', minHeight: '100vh', transition: 'all 0.3s'}}>
      <nav className="nav">
        <Link href="/" className="logo">likhle<span className="logo-dot">.</span></Link>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
  <span style={{ fontSize: 13, color: dark ? '#888' : '#666' }}>AI Caption Generator</span>
  <button onClick={() => setDark(!dark)} style={{background: dark ? '#1a1a1a' : '#E8E6E0', border: 'none', borderRadius:'100px', padding:'6px 14px', cursor:'pointer', fontSize:'13px', color: dark ? '#f0f0f0' : '#111', fontWeight:'500'}}>
    {dark ? '☀️ Light' : '🌙 Dark'}
  </button>
</div>
      </nav>

      <div className="gen-body">
        <div className="gen-header">
          <h1 className="gen-title">Kya likhna hai? ✍️</h1>
          <p className="gen-sub">Apna idea daalo — Likhle baki sambhal leta hai.</p>
        </div>

        <div className="gen-form">
          {/* Input */}
          <div className="input-group">
            <label className="input-label">Your Idea</label>
            <textarea
              className="gen-textarea"
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
            />
          </div>

          {/* Content Type */}
          <div className="input-group">
            <label className="input-label">Content Type</label>
            <div className="content-type-grid">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  className={`content-type-btn ${contentType === ct.value ? 'active' : ''}`}
                  onClick={() => setContentType(ct.value)}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="input-group">
            <label className="input-label">Tone / Vibe</label>
            <div className="options-row">
              {TONES.map((t) => (
                <button
                  key={t}
                  className={`tone-btn ${tone === t ? 'active' : ''}`}
                  onClick={() => setTone(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="input-group">
            <label className="input-label">Options</label>
            <div className="toggle-row">
              {[
                { label: 'Hinglish mode 🇮🇳', val: hinglish, set: setHinglish },
                { label: 'Add emojis ✨', val: emoji, set: setEmoji },
                { label: 'Add hashtags #', val: hashtags, set: setHashtags },
              ].map(({ label, val, set }) => (
                <div key={label} className="toggle-item" onClick={() => set(!val)}>
                  <div className={`toggle-check ${val ? 'on' : ''}`}>{val ? '✓' : ''}</div>
                  <span className={`toggle-label ${val ? 'on' : ''}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            className="gen-btn"
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Likh raha hai...' : 'Likhle! 🚀'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div>AI likh raha hai... ✨</div>
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 24, color: '#FF2D78', fontSize: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="results">
            <div className="results-title">Yeh lo {results.length} options 🔥</div>
            {results.map((r, i) => (
              <div key={i} className="result-card">
                <p className="result-text">{r}</p>
                <button
                  className={`copy-btn ${copied === i ? 'copied' : ''}`}
                  onClick={() => handleCopy(r, i)}
                >
                  {copied === i ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}