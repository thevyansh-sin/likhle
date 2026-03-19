'use client';
import { useState, useRef, useEffect } from 'react';
import { LuImage, LuFileText, LuFile, LuLink, LuCamera, LuPlus } from 'react-icons/lu';
import Link from 'next/link';

const PLACEHOLDERS = [
  "Make me an aesthetic Instagram caption for my Goa trip sunset photo 🌊",
  "Write a funny WhatsApp status for Monday morning mood 😂",
  "Create a savage Twitter bio for a student who codes 🔥",
  "LinkedIn bio for a fresher engineer, cool but professional 💼",
  "Hinglish Instagram caption for my gym transformation photo 💪",
  "POV caption for a late night drive with bestie 🌃",
  "Motivational Instagram bio for a fitness page 🏋️",
  "Romantic WhatsApp status in Hinglish for anniversary 💕",
  "Funny caption for a group photo at a desi wedding 🎉",
  "Reels hook for a cooking video, make it catchy 🍳",
  "Aesthetic caption for a rainy day window seat photo 🌧️",
  "Instagram caption for Diwali night, lights and family vibes 🪔",
  "POV caption for first day of college, nervous but excited 🎓",
  "Caption for my first salary celebration post 🥳",
  "Funny reels hook about being broke after the weekend 💸",
  "Aesthetic Instagram bio for a photography page 📸",
  "Hinglish caption for best friend's birthday post 🎂",
  "Savage WhatsApp status after exam season is over 😤",
  "Caption for a solo cafe date photo, me time vibes ☕",
  "Motivational caption for posting after a long break on Instagram 💫",
  "Funny caption for a gym selfie when you skipped leg day 😅",
  "Instagram bio for a Gen Z fashion blogger from Delhi 👗",
  "Reels hook for a study with me video at 2am ⏰",
  "Caption for a road trip photo, windows down, music loud 🚗",
  "Hinglish caption for a cricket match watching night 🏏",
  "Twitter bio for a music producer still in school 🎵",
  "Funny LinkedIn bio for a marketing intern who loves chai ☕",
  "Caption for mountains trip, cold wind aur hot maggi ⛰️",
  "Aesthetic caption for Holi with the gang 🎨",
  "Instagram bio for a startup founder in Class 12 🚀",
];

const TONES = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const OPTIONS = ['Hinglish 🇮🇳', 'Add Emojis ✨', 'Add Hashtags #'];

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  const [tone, setTone] = useState('Aesthetic');
  const [selectedOptions, setSelectedOptions] = useState(['Add Emojis ✨', 'Add Hashtags #']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [dark, setDark] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef(null);

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
    attBg: dark ? '#1a1a1a' : '#F0EEE8',
    attBorder: dark ? '#2a2a2a' : '#D8D6D0',
  };

  const toggleOption = (opt) => {
    setSelectedOptions(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResults([]);
    setError('');
    try {
      const hinglish = selectedOptions.includes('Hinglish 🇮🇳');
      const emoji = selectedOptions.includes('Add Emojis ✨');
      const hashtags = selectedOptions.includes('Add Hashtags #');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, tone, contentType: 'auto', hinglish, emoji, hashtags }),
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
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: -1, color: t.text, lineHeight: 1 }}>likhle<span style={{ color: '#CAFF00' }}>.</span></div>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.05em', marginTop: 3 }}>AI Caption Generator</div>
        </Link>
        <button onClick={() => setDark(!dark)} style={{ background: t.toggleBg, border: `1px solid ${t.border}`, borderRadius: 100, padding: '7px 16px', cursor: 'pointer', fontSize: 13, color: t.toggleText, fontWeight: 500, transition: 'all 0.2s' }}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: -2, color: t.text, marginBottom: 8 }}>Kya likhna hai? ✍️</h1>
          <p style={{ fontSize: 16, color: t.muted }}>Describe karo — AI sab samajh leta hai.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Attachment preview */}
          {attachment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.attBg, border: `1px solid ${t.attBorder}`, borderRadius: 10, padding: '10px 14px', width: 'fit-content' }}>
              <span style={{ fontSize: 20 }}>📎</span>
              <div>
                <div style={{ fontSize: 13, color: t.text }}>{attachment.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{(attachment.size / 1024).toFixed(1)} KB</div>
              </div>
              <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: 16, marginLeft: 6 }}>✕</button>
            </div>
          )}

          {/* Input */}
          <div style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 16, padding: '18px 20px 14px' }}>
            <textarea
              style={{ background: 'transparent', border: 'none', color: t.inputText, fontFamily: "'DM Sans', sans-serif", fontSize: 16, resize: 'none', minHeight: 100, outline: 'none', width: '100%', lineHeight: 1.7 }}
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 8 }}>
              <div style={{ position: 'relative' }}>
  <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.15s' }}>
    <LuPlus size={22} />
  </button>
  {showMenu && (
    <div style={{ position: 'absolute', bottom: 40, left: 0, background: dark ? '#1e1e1e' : '#fff', border: `1px solid ${t.border}`, borderRadius: 14, padding: 6, width: 200, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[
        { icon: <LuImage size={16}/>, label: 'Add photo', accept: 'image/*' },
        { icon: <LuFileText size={16}/>, label: 'Add document', accept: '.pdf,.doc,.docx' },
        { icon: <LuFile size={16}/>, label: 'Add file', accept: '*' },
        { icon: <LuLink size={16}/>, label: 'Paste link', accept: null },
      ].map((item) => (
        <div key={item.label} onClick={() => { if(item.accept) { fileRef.current.accept = item.accept; fileRef.current.click(); } setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: t.muted, transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = dark ? '#252525' : '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {item.icon}{item.label}
        </div>
      ))}
    </div>
  )}
  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
</div>
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                style={{ background: '#CAFF00', color: '#000', fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, padding: '8px 24px', border: 'none', borderRadius: 10, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'all 0.2s' }}
              >
                {loading ? 'Likh raha hai...' : 'Likhle! 🚀'}
              </button>
            </div>
          </div>

          {/* Tone */}
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

          {/* Options as pills */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Options</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {OPTIONS.map((opt) => (
                <button key={opt} onClick={() => toggleOption(opt)} style={{ background: selectedOptions.includes(opt) ? '#CAFF00' : t.toneBg, border: `1px solid ${selectedOptions.includes(opt) ? '#CAFF00' : t.toneBorder}`, color: selectedOptions.includes(opt) ? '#000' : t.toneText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 16px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s', fontWeight: selectedOptions.includes(opt) ? 700 : 400 }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: t.muted, fontSize: 15 }}>
            <div>AI likh raha hai... ✨</div>
            <div style={{ display: 'inline-flex', gap: 6, marginTop: 12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, background: '#CAFF00', borderRadius: '50%', animation: `bounce 1s infinite ${i*0.15}s` }} />)}
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 24, color: '#FF2D78', fontSize: 14, textAlign: 'center' }}>{error}</div>}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text, marginBottom: 8 }}>Yeh lo {results.length} options 🔥</div>
            {results.map((r, i) => (
              <div key={i} style={{ background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 14, padding: 20, position: 'relative' }}>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: t.text, whiteSpace: 'pre-wrap', paddingRight: 60 }}>{r}</p>
                <button onClick={() => handleCopy(r, i)} style={{ position: 'absolute', top: 14, right: 14, background: copied === i ? 'rgba(202,255,0,0.1)' : t.copyBg, border: `1px solid ${copied === i ? '#CAFF00' : t.resultBorder}`, color: copied === i ? '#CAFF00' : t.copyText, fontSize: 12, padding: '5px 12px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s' }}>
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