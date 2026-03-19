'use client';
import { useState } from 'react';
import Link from 'next/link';

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
  const [tone, setTone] = useState('Aesthetic');
  const [contentType, setContentType] = useState('instagram_caption');
  const [hinglish, setHinglish] = useState(false);
  const [emoji, setEmoji] = useState(true);
  const [hashtags, setHashtags] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
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
    <div className="gen-wrap">
      <nav className="nav">
        <Link href="/" className="logo">likhle<span className="logo-dot">.</span></Link>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>AI Caption Generator</span>
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
              placeholder="e.g. Gym ke baad selfie, feeling pumped... or just 'beach sunset aesthetic'"
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