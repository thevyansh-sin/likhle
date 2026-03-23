'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { flushSync } from 'react-dom';
import {
  LuBookmark,
  LuBookmarkCheck,
  LuCheck,
  LuCopy,
  LuImage,
  LuPlus,
  LuRefreshCw,
} from 'react-icons/lu';
import { siteVersion, siteVersionPrefix } from '../lib/site';
import { SITE_THEME_DEFAULT, SITE_THEME_STORAGE_KEY } from '../lib/theme';
import { templateLibrary } from '../template-library';

const PLACEHOLDERS = [
  'Make me an aesthetic Instagram caption for my Goa trip sunset photo 🌊',
  'Write a funny WhatsApp status for Monday morning mood 😂',
  'Create a savage Twitter bio for a student who codes 🔥',
  'LinkedIn bio for a fresher engineer, cool but professional 💼',
  'Hinglish Instagram caption for my gym transformation photo 💪',
  'POV caption for a late night drive with bestie 🌃',
  'Motivational Instagram bio for a fitness page 🏋️',
  'Romantic WhatsApp status in Hinglish for anniversary 💕',
  'Funny caption for a group photo at a desi wedding 🎉',
  'Reels hook for a cooking video, make it catchy 🍳',
  'Aesthetic caption for a rainy day window seat photo 🌧️',
  'Instagram caption for Diwali night, lights and family vibes 🪔',
  'POV caption for first day of college, nervous but excited 🎓',
  'Caption for my first salary celebration post 🥳',
  'Funny reels hook about being broke after the weekend 💸',
  'Aesthetic Instagram bio for a photography page 📸',
  "Hinglish caption for best friend's birthday post 🎂",
  'Savage WhatsApp status after exam season is over 😤',
  'Caption for a solo cafe date photo, me time vibes ☕',
  'Motivational caption for posting after a long break on Instagram 💫',
  'Funny caption for a gym selfie when you skipped leg day 😅',
  'Instagram bio for a Gen Z fashion blogger from Delhi 👗',
  'Reels hook for a study with me video at 2am ⏰',
  'Caption for a road trip photo, windows down, music loud 🚗',
  'Hinglish caption for a cricket match watching night 🏏',
  'Twitter bio for a music producer still in school 🎵',
  'Funny LinkedIn bio for a marketing intern who loves chai ☕',
  'Caption for mountains trip, cold wind aur hot maggi ⛰️',
  'Aesthetic caption for Holi with the gang 🎨',
  'Instagram bio for a startup founder in Class 12 🚀',
];

const TONES = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const OPTION_LABELS = {
  hinglish: 'Hinglish 🇮🇳',
  emojis: 'Emojis ✨',
  hashtags: 'Hashtags #',
};
const LEGACY_OPTION_LABELS = {
  'Add Emojis ✨': OPTION_LABELS.emojis,
  'Add Hashtags #': OPTION_LABELS.hashtags,
  'Hinglish ðŸ‡®ðŸ‡³': OPTION_LABELS.hinglish,
  'Hinglish Ã°Å¸â€¡Â®Ã°Å¸â€¡Â³': OPTION_LABELS.hinglish,
  'Add Emojis âœ¨': OPTION_LABELS.emojis,
  'Add Emojis Ã¢Å“Â¨': OPTION_LABELS.emojis,
};
const OPTIONS = [OPTION_LABELS.hinglish, OPTION_LABELS.emojis, OPTION_LABELS.hashtags];
const DEFAULT_OPTIONS = [OPTION_LABELS.emojis, OPTION_LABELS.hashtags];
const CLEAN_OPTION_VALUES = OPTION_LABELS;
const CLEAN_OPTIONS = OPTIONS;
const CLEAN_DEFAULT_OPTIONS = DEFAULT_OPTIONS;
const PLATFORM_OPTIONS = [
  'Auto Detect',
  'Instagram Caption',
  'Instagram Bio',
  'Reels Hook',
  'WhatsApp Status',
  'LinkedIn Bio',
  'Twitter/X Bio',
];
const LOADING_STEPS = ['Vibe read kar raha hai', 'Tone set kar raha hai', 'Final polish aa raha hai'];
const LENGTH_OPTIONS = ['Short', 'Medium', 'Long'];
const EMPTY_STATE_IDEAS = [
  {
    title: 'Trip dump',
    copy: 'Place, mood, aur vibe batao, phir bolo aesthetic, funny, ya clean mein kya chahiye.',
  },
  {
    title: 'Bio refresh',
    copy: 'Kaun ho, kya karte ho, aur tone cool chahiye ya professional, seedha bol do.',
  },
  {
    title: 'Reels opener',
    copy: 'Video topic daalo aur ek short hook maango jo ek line mein scroll rok de.',
  },
];
const REWRITE_ACTIONS = {
  shorter: { key: 'shorter', label: 'Shorter', pendingLabel: 'Shortening...' },
  moreAesthetic: { key: 'moreAesthetic', label: 'More aesthetic', pendingLabel: 'Polishing...' },
  moreFunny: { key: 'moreFunny', label: 'Funnier', pendingLabel: 'Punching up...' },
  moreSavage: { key: 'moreSavage', label: 'More savage', pendingLabel: 'Sharpening...' },
  moreMotivational: { key: 'moreMotivational', label: 'More motivational', pendingLabel: 'Boosting...' },
  moreRomantic: { key: 'moreRomantic', label: 'More romantic', pendingLabel: 'Softening...' },
  moreProfessional: { key: 'moreProfessional', label: 'More professional', pendingLabel: 'Refining...' },
  moreDesi: { key: 'moreDesi', label: 'More desi', pendingLabel: 'Localizing...' },
  moreHinglish: { key: 'moreHinglish', label: 'More Hinglish', pendingLabel: 'Mixing...' },
  moreEmoji: { key: 'moreEmoji', label: 'More emojis', pendingLabel: 'Decorating...' },
  betterHashtags: { key: 'betterHashtags', label: 'Better hashtags', pendingLabel: 'Tagging...' },
};
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_ACCEPT = SUPPORTED_IMAGE_TYPES.join(',');
const HISTORY_STORAGE_KEY = 'likhle-generation-history';
const FAVORITES_STORAGE_KEY = 'likhle-favorite-results';
const SESSION_KEY_STORAGE_KEY = 'likhle-session-key';
const REVEAL_SHOWN_STORAGE_KEY = 'likhle-reveal-shown';
const MAX_HISTORY_ITEMS = 10;
const MAX_FAVORITES_ITEMS = 24;

function formatHistoryTime(value) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function getFavoriteSignature({ text, input, platform, length, tone }) {
  return JSON.stringify([
    text?.trim() || '',
    input?.trim() || '',
    platform || 'Auto Detect',
    length || 'Medium',
    tone || 'Aesthetic',
  ]);
}

function createResultId() {
  return `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getResultText(result) {
  if (typeof result === 'string') {
    return result;
  }

  return typeof result?.text === 'string' ? result.text : '';
}

function looksLikeRawModelPayload(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return (
    /"results"\s*:/.test(value) ||
    /"rewriteSuggestions"\s*:/.test(value) ||
    /^\s*```json/.test(value)
  );
}

function normalizeRewriteSuggestions(rawSuggestions, fallbackActions) {
  if (!Array.isArray(rawSuggestions) || rawSuggestions.length === 0) {
    return fallbackActions;
  }

  return rawSuggestions
    .map((item, index) => {
      const label = typeof item?.label === 'string' ? item.label.trim() : '';
      const instruction = typeof item?.instruction === 'string' ? item.instruction.trim() : '';

      if (!label || !instruction) {
        return null;
      }

      return {
        key: typeof item?.key === 'string' ? item.key : `custom-${index}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        label,
        instruction,
        pendingLabel: typeof item?.pendingLabel === 'string' ? item.pendingLabel : 'Reworking...',
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeResultItem(result, fallbackActions) {
  const text = getResultText(result).trim();

  if (!text || looksLikeRawModelPayload(text)) {
    return null;
  }

  return {
    id: typeof result?.id === 'string' ? result.id : createResultId(),
    text,
    rewriteSuggestions: normalizeRewriteSuggestions(result?.rewriteSuggestions, fallbackActions),
  };
}

function normalizeResultItems(results, fallbackActions) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((result) => normalizeResultItem(result, fallbackActions))
    .filter(Boolean);
}

function legacySanitizeOptionLabel(option) {
  if (typeof option !== 'string') {
    return '';
  }

  if (/hinglish/i.test(option) || option.includes('ðŸ‡') || option.includes('Ã°Å¸')) {
    return CLEAN_OPTION_VALUES.hinglish;
  }

  if (/emoji/i.test(option) || option.includes('âœ¨') || option.includes('Ã¢Å“Â¨')) {
    return CLEAN_OPTION_VALUES.emojis;
  }

  if (/hashtag/i.test(option)) {
    return CLEAN_OPTION_VALUES.hashtags;
  }

  return option;
}

function legacyNormalizeSelectedOptions(options) {
  if (!Array.isArray(options)) {
    return CLEAN_DEFAULT_OPTIONS;
  }

  const normalizedOptions = options
    .map((option) => sanitizeOptionLabel(option))
    .filter((option) => CLEAN_OPTIONS.includes(option));

  return normalizedOptions.length > 0 ? Array.from(new Set(normalizedOptions)) : CLEAN_DEFAULT_OPTIONS;
}

function legacyGetOptionDisplayLabel(option) {
  if (option === 'Add Emojis âœ¨' || option === 'Add Emojis ✨') {
    return 'Emojis ✨';
  }

  if (option === 'Add Hashtags #') {
    return 'Hashtags #';
  }

  return option;
}

function sanitizeOptionLabel(option) {
  if (typeof option !== 'string') {
    return '';
  }

  if (
    /hinglish/i.test(option) ||
    option.includes('ðŸ‡') ||
    option.includes('Ã°Å¸â€¡') ||
    option.includes('ÃƒÂ°Ã…Â¸')
  ) {
    return OPTION_LABELS.hinglish;
  }

  if (
    /emoji/i.test(option) ||
    option.includes('âœ¨') ||
    option.includes('Ã¢Å“Â¨') ||
    option.includes('ÃƒÂ¢Ã…â€œÃ‚Â¨')
  ) {
    return OPTION_LABELS.emojis;
  }

  if (/hashtag/i.test(option)) {
    return OPTION_LABELS.hashtags;
  }

  return LEGACY_OPTION_LABELS[option] || option;
}

function normalizeSelectedOptions(options) {
  if (!Array.isArray(options)) {
    return DEFAULT_OPTIONS;
  }

  const normalizedOptions = options
    .map((option) => sanitizeOptionLabel(option))
    .filter((option) => OPTIONS.includes(option));

  return normalizedOptions.length > 0 ? Array.from(new Set(normalizedOptions)) : DEFAULT_OPTIONS;
}

function getOptionDisplayLabel(option) {
  return sanitizeOptionLabel(option);
}

function legacyGetRewriteActionsForContext({ tone, selectedOptions }) {
  const actions = [REWRITE_ACTIONS.shorter];
  const selectedToneAction = {
    Aesthetic: REWRITE_ACTIONS.moreAesthetic,
    Funny: REWRITE_ACTIONS.moreFunny,
    Savage: REWRITE_ACTIONS.moreSavage,
    Motivational: REWRITE_ACTIONS.moreMotivational,
    Romantic: REWRITE_ACTIONS.moreRomantic,
    Professional: REWRITE_ACTIONS.moreProfessional,
    Desi: REWRITE_ACTIONS.moreDesi,
  }[tone];

  if (selectedToneAction) {
    actions.push(selectedToneAction);
  }

  if (selectedOptions.includes('Hinglish 🇮🇳')) {
    actions.push(REWRITE_ACTIONS.moreHinglish);
  }

  if (selectedOptions.includes('Add Emojis ✨')) {
    actions.push(REWRITE_ACTIONS.moreEmoji);
  }

  if (selectedOptions.includes('Add Hashtags #')) {
    actions.push(REWRITE_ACTIONS.betterHashtags);
  }

  return actions;
}

function getRewriteActionsForContext({ tone, selectedOptions }) {
  const normalizedOptions = normalizeSelectedOptions(selectedOptions);
  const actions = [REWRITE_ACTIONS.shorter];
  const selectedToneAction = {
    Aesthetic: REWRITE_ACTIONS.moreAesthetic,
    Funny: REWRITE_ACTIONS.moreFunny,
    Savage: REWRITE_ACTIONS.moreSavage,
    Motivational: REWRITE_ACTIONS.moreMotivational,
    Romantic: REWRITE_ACTIONS.moreRomantic,
    Professional: REWRITE_ACTIONS.moreProfessional,
    Desi: REWRITE_ACTIONS.moreDesi,
  }[tone];

  if (selectedToneAction) {
    actions.push(selectedToneAction);
  }

  if (normalizedOptions.includes(OPTION_LABELS.hinglish)) {
    actions.push(REWRITE_ACTIONS.moreHinglish);
  }

  if (normalizedOptions.includes(OPTION_LABELS.emojis)) {
    actions.push(REWRITE_ACTIONS.moreEmoji);
  }

  if (normalizedOptions.includes(OPTION_LABELS.hashtags)) {
    actions.push(REWRITE_ACTIONS.betterHashtags);
  }

  return actions;
}

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [tone, setTone] = useState('Aesthetic');
  const [platform, setPlatform] = useState('Auto Detect');
  const [length, setLength] = useState('Medium');
  const [selectedOptions, setSelectedOptions] = useState(() => DEFAULT_OPTIONS);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [pendingResultAction, setPendingResultAction] = useState(null);
  const [copied, setCopied] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [dark, setDark] = useState(true);
  const [learnedVibe, setLearnedVibe] = useState(false);
  const [styleDNA, setStyleDNA] = useState(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealShown, setRevealShown] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [pasteShortcutLabel, setPasteShortcutLabel] = useState('');
  const [themeReady, setThemeReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusNotice, setStatusNotice] = useState('');
  const fileRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const outputSectionRef = useRef(null);
  const shouldFocusOutputRef = useRef(false);
  const sessionKeyRef = useRef('');

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  }, []);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);

      if (storedTheme === 'light') {
        setDark(false);
      } else if (storedTheme === 'dark') {
        setDark(true);
      } else {
        setDark(SITE_THEME_DEFAULT !== 'light');
      }
    } finally {
      setThemeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!themeReady) {
      return;
    }

    const nextTheme = dark ? 'dark' : 'light';
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
  }, [dark, themeReady]);

  useEffect(() => {
    try {
      const storedSessionKey = window.localStorage.getItem(SESSION_KEY_STORAGE_KEY);

      if (storedSessionKey) {
        sessionKeyRef.current = storedSessionKey;
        return;
      }

      const nextSessionKey =
        typeof crypto?.randomUUID === 'function'
          ? crypto.randomUUID()
          : `likhle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      sessionKeyRef.current = nextSessionKey;
      window.localStorage.setItem(SESSION_KEY_STORAGE_KEY, nextSessionKey);
    } catch (sessionError) {
      console.error('Session key setup failed:', sessionError);
      sessionKeyRef.current = `likhle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }, []);

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);

        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      }
    } catch (historyError) {
      console.error('History load failed:', historyError);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);

        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
        }
      }
    } catch (favoritesError) {
      console.error('Favorites load failed:', favoritesError);
    } finally {
      setFavoritesReady(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedReveal = window.localStorage.getItem(REVEAL_SHOWN_STORAGE_KEY);
      setRevealShown(storedReveal === 'true');
    } catch (e) {
      console.error('Reveal state load failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) {
      return;
    }

    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS))
    );
  }, [history, historyReady]);

  useEffect(() => {
    if (!favoritesReady) {
      return;
    }

    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites.slice(0, MAX_FAVORITES_ITEMS))
    );
  }, [favorites, favoritesReady]);

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(attachment);
    setAttachmentPreview(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [attachment]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const prompt = searchParams.get('prompt');
    const nextPlatform = searchParams.get('platform');
    const nextLength = searchParams.get('length');
    const nextTone = searchParams.get('tone');
    const nextHinglish = searchParams.get('hinglish');
    const nextEmoji = searchParams.get('emoji');
    const nextHashtags = searchParams.get('hashtags');

    if (prompt) {
      setInput(prompt);
    }

    if (nextPlatform && PLATFORM_OPTIONS.includes(nextPlatform)) {
      setPlatform(nextPlatform);
    }

    if (nextLength && LENGTH_OPTIONS.includes(nextLength)) {
      setLength(nextLength);
    }

    if (nextTone && TONES.includes(nextTone)) {
      setTone(nextTone);
    }

    if (nextHinglish || nextEmoji || nextHashtags) {
      const nextOptions = [];

      if (nextHinglish === 'true') {
        nextOptions.push('Hinglish 🇮🇳');
      }

      if (nextEmoji !== 'false') {
        nextOptions.push('Add Emojis ✨');
      }

      if (nextHashtags !== 'false') {
        nextOptions.push('Add Hashtags #');
      }

      setSelectedOptions(normalizeSelectedOptions(nextOptions));
    }
  }, []);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasTouchInput = navigator.maxTouchPoints > 0;
    const platform = navigator.platform || '';

    if (!hasFinePointer || hasTouchInput) {
      setPasteShortcutLabel('');
      return;
    }

    setPasteShortcutLabel(platform.toLowerCase().includes('mac') ? 'Cmd+V' : 'Ctrl+V');
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      return undefined;
    }

    setLoadingStageIndex(0);

    const timeouts = LOADING_STEPS.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setLoadingStageIndex(index + 1);
      }, (index + 1) * 1100)
    );

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [loading]);

  useEffect(() => {
    if (!shouldFocusOutputRef.current) {
      return;
    }

    if (!loading && results.length === 0 && !error) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      outputSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    if (!loading && (results.length > 0 || error)) {
      shouldFocusOutputRef.current = false;
    }

    return () => window.cancelAnimationFrame(frame);
  }, [loading, results.length, error]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const t = {
    bg: dark ? '#080808' : '#F5F3EC',
    pageBg: dark
      ? 'radial-gradient(circle at top right, rgba(202,255,0,0.08) 0%, rgba(202,255,0,0) 24%), radial-gradient(circle at top left, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 28%), #080808'
      : 'radial-gradient(circle at top right, rgba(112,137,0,0.10) 0%, rgba(112,137,0,0) 28%), radial-gradient(circle at top left, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0) 30%), #F5F3EC',
    navBg: dark ? 'rgba(8,8,8,0.82)' : 'rgba(245,243,236,0.84)',
    text: dark ? '#f0f0f0' : '#111111',
    muted: dark ? '#888888' : '#5F5A52',
    border: dark ? '#222222' : '#E0DED8',
    accent: dark ? '#CAFF00' : '#C2E200',
    accentInk: dark ? '#CAFF00' : '#6F8500',
    toneBg: dark ? '#1a1a1a' : '#EFEFEB',
    toneBorder: dark ? '#333333' : '#D8D6D0',
    toneText: dark ? '#888888' : '#555555',
    inputBg: dark ? '#111111' : '#FFFEFA',
    inputBorder: dark ? '#333333' : '#D8D6D0',
    inputText: dark ? '#f0f0f0' : '#111111',
    toggleBg: dark ? '#1a1a1a' : '#E8E6E0',
    toggleText: dark ? '#f0f0f0' : '#111111',
    resultBg: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%), #111111'
      : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,252,244,0.85) 100%), #FFFFFF',
    resultBorder: dark ? '#222222' : '#E8E6E0',
    copyBg: dark ? '#1a1a1a' : '#F0EEE8',
    copyText: dark ? '#888888' : '#666666',
    attBg: dark ? '#111111' : '#FFFFFF',
    attBorder: dark ? '#2a2a2a' : '#D8D6D0',
    menuBg: dark ? '#1e1e1e' : '#ffffff',
    sectionBg: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%), #0F0F0F'
      : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,252,244,0.82) 100%), #FFFEFA',
    sectionBorder: dark ? '#1D1D1D' : '#E3DFD7',
    chipShadow: dark ? '0 10px 24px rgba(0,0,0,0.22)' : '0 10px 24px rgba(0,0,0,0.05)',
    sectionShadow: dark ? '0 18px 44px rgba(0,0,0,0.18)' : '0 18px 44px rgba(35,27,10,0.08)',
  };

  const sectionCardStyle = {
    background: t.sectionBg,
    border: `1px solid ${t.sectionBorder}`,
    borderRadius: 22,
    padding: 20,
    boxShadow: t.sectionShadow,
  };

  const sectionLabelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: t.muted,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const sectionHelpStyle = {
    fontSize: 13,
    color: t.muted,
    lineHeight: 1.65,
    marginTop: 8,
  };

  const pillRowStyle = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 14,
  };

  const getPillStyle = (isActive) => ({
    background: isActive ? t.accent : t.toneBg,
    border: `1px solid ${isActive ? t.accent : t.toneBorder}`,
    color: isActive ? '#000' : t.toneText,
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    padding: '10px 18px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    fontWeight: isActive ? 700 : 500,
    boxShadow: isActive ? t.chipShadow : 'none',
  });

  const toggleOption = (option) => {
    setSelectedOptions((previousOptions) => {
      const normalizedOptions = normalizeSelectedOptions(previousOptions);

      return normalizedOptions.includes(option)
        ? normalizedOptions.filter((item) => item !== option)
        : [...normalizedOptions, option];
    });
  };

  const getTemplateOptions = (template) => {
    const nextOptions = [];

    if (template.hinglish) {
      nextOptions.push('Hinglish ðŸ‡®ðŸ‡³');
    }

    if (template.emoji) {
      nextOptions.push('Add Emojis âœ¨');
    }

    if (template.hashtags) {
      nextOptions.push('Add Hashtags #');
    }

    return normalizeSelectedOptions(nextOptions);
  };

  const handleApplyTemplate = async (template) => {
    if (controlsDisabled) {
      return;
    }

    const templateOptions = getTemplateOptions(template);
    const templateRequestContext = {
      inputOverride: template.prompt,
      toneOverride: template.tone,
      platformOverride: template.platform,
      lengthOverride: template.length,
      selectedOptionsOverride: templateOptions,
      attachmentOverride: null,
    };

    flushSync(() => {
      setInput(template.prompt);
      setPlatform(template.platform);
      setTone(template.tone);
      setLength(template.length);
      setSelectedOptions(templateOptions);
      setAttachment(null);
      setResults([]);
      setError('');
      setStatusNotice('');
      setSessionId('');
    });

    shouldFocusOutputRef.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const nextResults = await requestGeneration({
      count: 3,
      ...templateRequestContext,
    });

    if (!nextResults) {
      return;
    }

    setResults(nextResults);
    syncHistory(nextResults, `likhle-${Date.now()}`, templateRequestContext);
  };

  const showToast = (message, tone = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      tone,
    });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const validateAttachment = (file) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, or WEBP images are supported right now.';
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return 'Image too large. Please keep it under 5 MB.';
    }

    return '';
  };

  const applyAttachment = (file, source = 'upload') => {
    const validationError = validateAttachment(file);

    if (validationError) {
      setAttachment(null);
      setError(validationError);
      setShowMenu(false);
      return false;
    }

    const nextFileName = file.name || `pasted-image-${Date.now()}.png`;
    const nextFile = file instanceof File
      ? new File([file], nextFileName, {
          type: file.type || 'image/png',
          lastModified: file.lastModified || Date.now(),
        })
      : new File([file], nextFileName, {
          type: file.type || 'image/png',
          lastModified: Date.now(),
        });

    setAttachment(nextFile);
    setError('');
    setShowMenu(false);
    showToast(source === 'paste' ? 'Screenshot pasted into the prompt.' : 'Image added to your prompt.');
    return true;
  };

  const resolveRequestContext = ({
    inputOverride,
    toneOverride,
    platformOverride,
    lengthOverride,
    selectedOptionsOverride,
    attachmentOverride,
  } = {}) => {
    const nextSelectedOptions = normalizeSelectedOptions(
      Array.isArray(selectedOptionsOverride) ? selectedOptionsOverride : selectedOptions
    );

    return {
      nextInput: typeof inputOverride === 'string' ? inputOverride : input,
      nextTone: typeof toneOverride === 'string' ? toneOverride : tone,
      nextPlatform: typeof platformOverride === 'string' ? platformOverride : platform,
      nextLength: typeof lengthOverride === 'string' ? lengthOverride : length,
      nextSelectedOptions,
      nextAttachment:
        attachmentOverride === undefined ? attachment : attachmentOverride,
    };
  };

  const syncHistory = (nextResults, nextId, contextOverrides = {}) => {
    const historyId = nextId || sessionId || `likhle-${Date.now()}`;
    const {
      nextInput,
      nextTone,
      nextPlatform,
      nextLength,
      nextSelectedOptions,
      nextAttachment,
    } = resolveRequestContext(contextOverrides);
    const normalizedResults = normalizeResultItems(nextResults, visibleRewriteActions).map((item) => ({
      text: item.text,
      rewriteSuggestions: item.rewriteSuggestions.map((suggestion) => ({
        label: suggestion.label,
        instruction: suggestion.instruction,
      })),
    }));
    const entry = {
      id: historyId,
      input: nextInput.trim(),
      tone: nextTone,
      platform: nextPlatform,
      length: nextLength,
      selectedOptions: nextSelectedOptions,
      results: normalizedResults,
      createdAt: Date.now(),
      hadImage: Boolean(nextAttachment),
    };

    setSessionId(historyId);
    setHistory((previousHistory) =>
      [entry, ...previousHistory.filter((item) => item.id !== historyId)].slice(0, MAX_HISTORY_ITEMS)
    );
  };

  const buildFavoriteEntry = (resultItem) => ({
    id: `favorite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    signature: getFavoriteSignature({ text: getResultText(resultItem), input, platform, length, tone }),
    text: getResultText(resultItem),
    rewriteSuggestions: normalizeResultItem(resultItem, visibleRewriteActions)?.rewriteSuggestions.map((suggestion) => ({
      label: suggestion.label,
      instruction: suggestion.instruction,
    })) || [],
    input: input.trim(),
    tone,
    platform,
    length,
    selectedOptions: normalizeSelectedOptions(selectedOptions),
    createdAt: Date.now(),
    hadImage: Boolean(attachment),
  });

  const findFavoriteForResult = (resultItem) => (
    favorites.find(
      (entry) =>
        entry.signature === getFavoriteSignature({ text: getResultText(resultItem), input, platform, length, tone })
    )
  );

  const handleToggleFavorite = (resultItem) => {
    const existingFavorite = findFavoriteForResult(resultItem);

    if (existingFavorite) {
      setFavorites((previousFavorites) =>
        previousFavorites.filter((entry) => entry.id !== existingFavorite.id)
      );
      showToast('Removed from favorites.');
      return;
    }

    const nextFavorite = buildFavoriteEntry(resultItem);
    setFavorites((previousFavorites) => [nextFavorite, ...previousFavorites].slice(0, MAX_FAVORITES_ITEMS));
    showToast('Saved to favorites.');
  };

  const handleUseFavorite = (entry) => {
    const restoredOptions = normalizeSelectedOptions(entry.selectedOptions);

    setInput(entry.input || '');
    setTone(entry.tone || 'Aesthetic');
    setPlatform(entry.platform || 'Auto Detect');
    setLength(entry.length || 'Medium');
    setSelectedOptions(restoredOptions);
    setResults(
      entry.text
        ? normalizeResultItems(
            [{ text: entry.text, rewriteSuggestions: entry.rewriteSuggestions || [] }],
            getRewriteActionsForContext({
              tone: entry.tone || 'Aesthetic',
              selectedOptions: restoredOptions,
            })
          )
        : []
    );
    setSessionId('');
    setAttachment(null);
    setError('');
    showToast('Favorite loaded back into the generator.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildRequestFormData = ({
    count = 3,
    avoidResults = [],
    rewriteAction = '',
    rewriteInstruction = '',
    currentResult = '',
    inputOverride,
    toneOverride,
    platformOverride,
    lengthOverride,
    selectedOptionsOverride,
    attachmentOverride,
  } = {}) => {
    const {
      nextInput,
      nextTone,
      nextPlatform,
      nextLength,
      nextSelectedOptions,
      nextAttachment,
    } = resolveRequestContext({
      inputOverride,
      toneOverride,
      platformOverride,
      lengthOverride,
      selectedOptionsOverride,
      attachmentOverride,
    });
    const hinglish = selectedOptions.includes('Hinglish 🇮🇳');
    const emoji = selectedOptions.includes('Add Emojis ✨');
    const hashtags = selectedOptions.includes('Add Hashtags #');
    const formData = new FormData();

    formData.append('input', nextInput.trim());
    formData.append('tone', nextTone);
    formData.append('platform', nextPlatform);
    formData.append('length', nextLength);
    formData.append('count', String(count));
    formData.append('hinglish', String(hinglish));
    formData.append('emoji', String(emoji));
    formData.append('hashtags', String(hashtags));

    const normalizedOptions = nextSelectedOptions;
    formData.set('hinglish', String(normalizedOptions.includes(OPTION_LABELS.hinglish)));
    formData.set('emoji', String(normalizedOptions.includes(OPTION_LABELS.emojis)));
    formData.set('hashtags', String(normalizedOptions.includes(OPTION_LABELS.hashtags)));

    if (avoidResults.length > 0) {
      formData.append('avoidResults', JSON.stringify(avoidResults));
    }

    if (rewriteAction) {
      formData.append('rewriteAction', rewriteAction);
    }

    if (rewriteInstruction) {
      formData.append('rewriteInstruction', rewriteInstruction);
    }

    if (currentResult) {
      formData.append('currentResult', currentResult);
    }

    if (sessionKeyRef.current) {
      formData.append('sessionKey', sessionKeyRef.current);
    }

    if (nextAttachment) {
      formData.append('image', nextAttachment);
    }

    return formData;
  };

  const requestGeneration = async ({
    count = 3,
    resultIndex = null,
    avoidResults = [],
    rewriteAction = '',
    rewriteInstruction = '',
    currentResult = '',
    pendingLabel = 'Refreshing...',
    inputOverride,
    toneOverride,
    platformOverride,
    lengthOverride,
    selectedOptionsOverride,
    attachmentOverride,
  } = {}) => {
    const { nextInput, nextAttachment } = resolveRequestContext({
      inputOverride,
      toneOverride,
      platformOverride,
      lengthOverride,
      selectedOptionsOverride,
      attachmentOverride,
    });

    if (!nextInput.trim()) {
      return null;
    }

    if (nextAttachment) {
      const validationError = validateAttachment(nextAttachment);

      if (validationError) {
        setError(validationError);
        return null;
      }
    }

    if (resultIndex === null) {
      setLoading(true);
      setResults([]);
    } else {
      setPendingResultAction({ index: resultIndex, label: pendingLabel });
    }

    setStatusNotice('');
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: buildRequestFormData({
          count,
          avoidResults,
          rewriteAction,
          rewriteInstruction,
          currentResult,
          inputOverride,
          toneOverride,
          platformOverride,
          lengthOverride,
          selectedOptionsOverride,
          attachmentOverride,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const nextError = data.error || 'Kuch gadbad ho gayi 😅 Try again!';
        const shouldKeepCurrentResults = response.status === 429 && (resultIndex !== null || results.length > 0);

        if (shouldKeepCurrentResults) {
          setStatusNotice(nextError);
          showToast('Current results are still safe. Try again in a moment.');
          setError('');
          return null;
        }

        setError(nextError);
        return null;
      }

      if (!Array.isArray(data.results) || data.results.length === 0) {
        setError('AI ne abhi kuch nahi likha. Please try again!');
        return null;
      }

      const normalizedResults = normalizeResultItems(data.results, visibleRewriteActions);

      if (normalizedResults.length === 0) {
        setError('AI response format broke for that try. Please run it once more.');
        return null;
      }

      setStatusNotice('');
      if (typeof data.learnedVibe === 'boolean') {
        setLearnedVibe(data.learnedVibe);
        if (data.learnedVibe) fetchStyleDNA();
      }
      return normalizedResults;
    } catch {
      setError('Server se connection nahi hua. Try again!');
      return null;
    } finally {
      if (resultIndex === null) {
        setLoading(false);
      } else {
        setPendingResultAction(null);
      }
    }
  };

  const fetchStyleDNA = async (forceReveal = false) => {
    if (!sessionKeyRef.current) return;
    try {
      const resp = await fetch(`/api/style-dna?sessionKey=${sessionKeyRef.current}`);
      const data = await resp.json();
      if (data.dna) {
        setStyleDNA(data.dna);
        
        // Trigger reveal if not shown and enough data
        if (!revealShown && data.dna.generationCount >= 3) {
          setIsRevealModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch Style DNA:', e);
    }
  };

  const handleShareVibe = () => {
    if (!styleDNA) return;
    
    const shareText = `My writing style: ${styleDNA.tone} ⚡\n${styleDNA.language}. ${styleDNA.emoji}.\nMade with Likhle`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setToast({ message: 'Vibe copied! Go share it 🚀', type: 'success' });
    }).catch(() => {
      setToast({ message: 'Copy failed. Try again!', type: 'error' });
    });
  };

  const dismissReveal = () => {
    setIsRevealModalOpen(false);
    setRevealShown(true);
    window.localStorage.setItem(REVEAL_SHOWN_STORAGE_KEY, 'true');
  };

  useEffect(() => {
    if (historyReady) fetchStyleDNA();
  }, [historyReady]);

  const handleFile = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    applyAttachment(file, 'upload');
    event.target.value = '';
  };

  const handleComposerPaste = (event) => {
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const imageItem = clipboardItems.find((item) => item.type.startsWith('image/'));

    if (!imageItem) {
      return;
    }

    const pastedImage = imageItem.getAsFile();

    if (!pastedImage) {
      return;
    }

    event.preventDefault();
    applyAttachment(pastedImage, 'paste');
  };

  const handleGenerate = async () => {
    shouldFocusOutputRef.current = true;
    const nextResults = await requestGeneration({ count: 3 });

    if (!nextResults) {
      return;
    }

    setResults(nextResults);
    syncHistory(nextResults, `likhle-${Date.now()}`);
  };

  const handleRegenerateOption = async (index) => {
    const freshResults = await requestGeneration({
      count: 1,
      resultIndex: index,
      avoidResults: results.map((item) => getResultText(item)),
      pendingLabel: 'Refreshing...',
    });

    if (!freshResults?.[0]) {
      return;
    }

    const nextResults = results.map((item, itemIndex) =>
      itemIndex === index ? freshResults[0] : item
    );

    setResults(nextResults);
    syncHistory(nextResults, sessionId || `likhle-${Date.now()}`);
  };

  const handleRewriteOption = async (index, currentResult, action) => {
    const freshResults = await requestGeneration({
      count: 1,
      resultIndex: index,
      rewriteAction: action.key || '',
      rewriteInstruction: action.instruction || '',
      currentResult: getResultText(currentResult),
      pendingLabel: action.pendingLabel || 'Reworking...',
    });

    if (!freshResults?.[0]) {
      return;
    }

    const nextResults = results.map((item, itemIndex) =>
      itemIndex === index ? freshResults[0] : item
    );

    setResults(nextResults);
    syncHistory(nextResults, sessionId || `likhle-${Date.now()}`);
  };

  const handleCopy = async (text, copyKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(copyKey);
      showToast('Copied to clipboard.');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Copy nahi hua. Ek baar aur try karo.');
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.map((item) => getResultText(item)).join('\n\n'));
      setCopiedAll(true);
      showToast('All options copied.');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setError('Copy nahi hua. Ek baar aur try karo.');
    }
  };

  const handleDownload = () => {
    const textOutput = [
      `Prompt: ${input}`,
      `Platform: ${platform}`,
      `Length: ${length}`,
      `Tone: ${tone}`,
      `Options: ${normalizeSelectedOptions(selectedOptions).join(', ') || 'None'}`,
      attachment ? `Image: ${attachment.name}` : 'Image: None',
      '',
      ...results.map((item, index) => `Option ${index + 1}\n${getResultText(item)}`),
    ].join('\n\n');

    const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `likhle-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    showToast('Text file downloaded.');
  };

  const handleRestoreHistory = (entry) => {
    const restoredOptions = normalizeSelectedOptions(entry.selectedOptions);

    setInput(entry.input || '');
    setTone(entry.tone || 'Aesthetic');
    setPlatform(entry.platform || 'Auto Detect');
    setLength(entry.length || 'Medium');
    setSelectedOptions(restoredOptions);
    setResults(
      normalizeResultItems(
        Array.isArray(entry.results) ? entry.results : [],
        getRewriteActionsForContext({
          tone: entry.tone || 'Aesthetic',
          selectedOptions: restoredOptions,
        })
      )
    );
    setSessionId(entry.id || '');
    setAttachment(null);
    setError('');
    showToast('Loaded from recent history.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveFavorite = (id) => {
    setFavorites((previousFavorites) => previousFavorites.filter((entry) => entry.id !== id));
    showToast('Favorite removed.');
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSessionId('');
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    showToast('Recent history cleared.');
  };

  const handleClearFavorites = () => {
    setFavorites([]);
    window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
    showToast('Favorites cleared.');
  };

  const actionButtonStyle = {
    background: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      : 'linear-gradient(180deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.01) 100%)',
    border: `1px solid ${t.resultBorder}`,
    color: t.copyText,
    fontSize: 12,
    fontWeight: 700,
    padding: '10px 15px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '0.01em',
    minHeight: 40,
  };

  const rewriteButtonStyle = (disabled) => ({
    background: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      : 'linear-gradient(180deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.01) 100%)',
    border: `1px solid ${t.resultBorder}`,
    color: t.copyText,
    fontSize: 11,
    fontWeight: 700,
    padding: '10px 14px',
    borderRadius: 999,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    opacity: disabled ? 0.55 : 1,
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    flex: '0 0 auto',
    minWidth: 0,
  });

  const getResultIconButtonStyle = ({ active = false, disabled = false } = {}) => ({
    width: 38,
    height: 38,
    background: active
      ? (dark ? 'rgba(202,255,0,0.08)' : 'rgba(147,181,0,0.10)')
      : t.copyBg,
    border: `1px solid ${active ? t.accentInk : t.resultBorder}`,
    color: active ? t.accentInk : t.copyText,
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.55 : 1,
    boxShadow: active ? t.chipShadow : 'none',
  });

  const controlsDisabled = loading || pendingResultAction !== null;
  const visibleRewriteActions = getRewriteActionsForContext({ tone, selectedOptions });
  const hasPrompt = input.trim().length > 0;
  const isQuotaError =
    /ai quota/i.test(error) || /too many tries right now/i.test(error);
  const quotaHelperCopy = isQuotaError
    ? 'Try again in 30-60 seconds. If you were testing very fast, give it a small pause and then run it again.'
    : '';
  const errorCardKicker = isQuotaError ? 'Quota pause' : 'This try broke';
  const errorCardTitle = isQuotaError
    ? 'AI quota is busy right now.'
    : 'No usable caption came back that time.';
  const emptyStateTitle = hasPrompt ? 'Your setup already looks ready.' : 'Start with a vibe, not a perfect sentence.';
  const emptyStateCopy = hasPrompt
    ? 'Press Enter or hit Likhle and we will turn this prompt into three stronger directions.'
    : 'Type one clear line, then let the format, tone, and length controls shape the rest for you.';
  const loadingStateCopy = 'We are locking the format, tone, and extras first, then shaping three cleaner directions for the same post.';
  const resultsMetaCopy = [platform, length, tone, attachment ? 'Image-aware' : null].filter(Boolean).join(' · ');
  const showGenerationErrorCard = !loading && results.length === 0 && Boolean(error);
  const showInlineError = Boolean(error) && !showGenerationErrorCard;

  const primaryActionButtonStyle = {
    background: t.accent,
    border: `1px solid ${t.accent}`,
    color: '#050607',
    fontSize: 13,
    fontWeight: 700,
    padding: '11px 16px',
    borderRadius: 14,
    cursor: controlsDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '0.01em',
    boxShadow: t.chipShadow,
    opacity: controlsDisabled ? 0.55 : 1,
  };

  const renderTemplateCard = (template, compact = false) => (
    <button
      className="gen-surface-card gen-template-card"
      key={template.id}
      onClick={() => handleApplyTemplate(template)}
      disabled={controlsDisabled}
      style={{
        background: t.resultBg,
        border: `1px solid ${t.resultBorder}`,
        borderRadius: 16,
        padding: compact ? 14 : 16,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: controlsDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        minWidth: compact ? 'min(78vw, 260px)' : 'min(82vw, 280px)',
        boxShadow: t.sectionShadow,
        opacity: controlsDisabled ? 0.6 : 1,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            color: t.accentInk,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {template.category}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: compact ? 18 : 20,
            fontWeight: 700,
            color: t.text,
            marginTop: 8,
            letterSpacing: -0.4,
          }}
        >
          {template.title}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: t.muted,
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: compact ? 3 : 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {template.prompt}
      </div>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: `1px solid ${t.resultBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: compact ? 12 : 13,
            color: t.text,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {template.platform}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            color: t.muted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          <span>{template.length}</span>
          <span style={{ color: dark ? 'rgba(202,255,0,0.55)' : 'rgba(111,133,0,0.75)' }}>•</span>
          <span>{template.tone}</span>
        </div>
      </div>
    </button>
  );

  const composerPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {attachment && (
        <div className="gen-surface-card gen-surface-card--subtle" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 14, background: t.attBg, border: `1px solid ${t.attBorder}`, borderRadius: 16, padding: 14, boxShadow: t.sectionShadow }}>
          {attachmentPreview && (
            <Image
              src={attachmentPreview}
              alt="Uploaded preview"
              width={116}
              height={116}
              unoptimized
              style={{ width: 116, height: 116, objectFit: 'cover', borderRadius: 12, border: `1px solid ${t.border}` }}
            />
          )}
          <div style={{ display: 'flex', flex: 1, minWidth: 180, justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{attachment.name}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 6 }}>
                {(attachment.size / 1024).toFixed(1)} KB · JPG/PNG/WEBP only
              </div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>
                Preview ready. AI will use this image while generating.
              </div>
            </div>
            <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: 16, alignSelf: 'flex-start' }}>×</button>
          </div>
        </div>
      )}

      <div className="gen-surface-card gen-composer-card" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 16, padding: '18px 20px 14px', boxShadow: t.sectionShadow }}>
        <textarea
          className="gen-composer-input"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleGenerate();
            }
          }}
          onPaste={handleComposerPaste}
          style={{ background: 'transparent', border: 'none', color: t.inputText, fontFamily: 'var(--font-body)', fontSize: 16, resize: 'none', minHeight: 100, outline: 'none', width: '100%', lineHeight: 1.7 }}
          placeholder={placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 8 }}>
          <div style={{ position: 'relative' }} onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Add image"
              style={{ width: 40, height: 40, background: t.toggleBg, border: `1px solid ${t.border}`, color: t.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, transition: 'all 0.15s' }}
            >
              <LuPlus size={22} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', bottom: 40, left: 0, background: t.menuBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 6, width: 190, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div
                  onClick={() => {
                    fileRef.current.accept = IMAGE_ACCEPT;
                    fileRef.current.click();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: t.muted, transition: 'background 0.1s' }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = dark ? '#252525' : '#f0f0f0';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LuImage size={15} /> Add photo
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleFile} />
          </div>

          <div style={{ fontSize: 12, color: t.muted, flex: 1, minWidth: 180 }}>
            {pasteShortcutLabel
              ? `Tap + to add a reference image, or press ${pasteShortcutLabel} after copying a screenshot. Supports JPG, PNG, WEBP up to 5 MB.`
              : 'Tap + to add a reference image. Supports JPG, PNG, WEBP up to 5 MB.'}
          </div>

          <button
            className="gen-submit-button"
            onClick={handleGenerate}
            disabled={controlsDisabled || !input.trim()}
            style={{ background: t.accent, color: '#000', border: 'none', borderRadius: 12, cursor: controlsDisabled || !input.trim() ? 'not-allowed' : 'pointer', opacity: controlsDisabled || !input.trim() ? 0.5 : 1, transition: 'all 0.2s', boxShadow: controlsDisabled || !input.trim() ? 'none' : t.sectionShadow }}
          >
            {loading ? 'Likh raha hai...' : 'Likhle! 🚀'}
          </button>
        </div>
      </div>
    </div>
  );

  const mobileTemplateLibrary = (
    <div className="gen-surface-card" style={sectionCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={sectionLabelStyle}>Quick Start Templates</div>
          <div style={sectionHelpStyle}>
            Tap one if you want a fast start. Likhle will load the setup and generate results right away.
          </div>
        </div>
        <div style={{ fontSize: 12, color: t.muted }}>
          Swipe sideways to browse quick starts.
        </div>
      </div>

      <div
        className="template-scroll-row"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 6,
          marginTop: 16,
          scrollbarColor: `${t.accentInk} ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.08)'}`,
          scrollbarWidth: 'thin',
          ['--template-scroll-track']: dark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.08)',
          ['--template-scroll-thumb']: t.accentInk,
          ['--template-scroll-thumb-hover']: dark ? '#d8ff4d' : '#5f7500',
        }}
      >
        {templateLibrary.map((template) => renderTemplateCard(template))}
      </div>
    </div>
  );

  return (
    <div
      style={{ minHeight: '100vh', background: t.pageBg, transition: 'all 0.3s', fontFamily: 'var(--font-body)' }}
      onClick={() => setShowMenu(false)}
    >
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: 'clamp(18px, 2.6vw, 20px) clamp(20px, 4vw, 40px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100, background: t.navBg, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, letterSpacing: -1, color: t.text, lineHeight: 1 }}>likhle<span style={{ color: t.accentInk }}>.</span></div>
        </Link>
        <button onClick={() => setDark(!dark)} style={{ background: t.toggleBg, border: `1px solid ${t.border}`, borderRadius: 100, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: t.toggleText, fontWeight: 500, transition: 'all 0.2s', boxShadow: t.sectionShadow }}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(40px, 6vw, 60px) clamp(16px, 4vw, 20px)' }}>
        <div style={{ marginBottom: 48 }} data-reveal>
          <h1 className="gen-page-title" style={{ color: t.text, marginBottom: 8 }}>Kya likhna hai? ✍️</h1>
          <p style={{ fontSize: 16, color: t.muted }}>Describe karo — AI sab samajh leta hai.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div data-reveal>{composerPanel}</div>

          <div style={sectionCardStyle} data-reveal>
            <div style={sectionLabelStyle}>Platform / Format</div>
            <div style={sectionHelpStyle}>Choose exactly where this text will be used so the output fits better.</div>
            <div style={pillRowStyle}>
              {PLATFORM_OPTIONS.map((option) => (
                <button key={option} onClick={() => setPlatform(option)} style={getPillStyle(platform === option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }} data-reveal>
            <div className="gen-surface-card" style={sectionCardStyle} data-reveal data-reveal-delay="0.02s">
              <div style={sectionLabelStyle}>Length</div>
              <div style={sectionHelpStyle}>Pick how short or detailed each result should feel.</div>
              <div style={pillRowStyle}>
                {LENGTH_OPTIONS.map((option) => (
                  <button key={option} onClick={() => setLength(option)} style={getPillStyle(length === option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="gen-surface-card" style={sectionCardStyle} data-reveal data-reveal-delay="0.06s">
              <div style={sectionLabelStyle}>Options</div>
              <div style={sectionHelpStyle}>Turn on extras like Hinglish, emojis, or hashtags.</div>
              <div style={pillRowStyle}>
                {OPTIONS.map((option) => (
                  <button key={option} onClick={() => toggleOption(option)} style={getPillStyle(selectedOptions.includes(option))}>
                    {getOptionDisplayLabel(option)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {styleDNA && (
            <div 
              className="gen-surface-card" 
              data-reveal
              style={{
                ...sectionCardStyle,
                background: dark 
                  ? 'linear-gradient(180deg, rgba(202,255,0,0.05) 0%, rgba(20,20,20,1) 100%)' 
                  : 'linear-gradient(180deg, rgba(147,181,0,0.04) 0%, rgba(255,255,255,1) 100%)',
                border: `1px solid ${dark ? 'rgba(202,255,0,0.15)' : 'rgba(147,181,0,0.15)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ ...sectionLabelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Your Style DNA <span style={{ opacity: 0.6 }}>🧬</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: t.accentInk, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {styleDNA.generationCount} Generations
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 20px', marginBottom: 20 }}>
                {[
                  { label: 'Tone', value: styleDNA.tone },
                  { label: 'Language', value: styleDNA.language },
                  { label: 'Emoji Style', value: styleDNA.emoji },
                  { label: 'Structure', value: styleDNA.structure },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 14, color: t.text, fontWeight: 700 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${t.resultBorder}`, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Your vibe
                  </div>
                  <div style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: 22, 
                    fontWeight: 800, 
                    color: t.accentInk,
                    letterSpacing: -0.5,
                    textShadow: dark ? '0 0 20px rgba(202,255,0,0.2)' : 'none'
                  }}>
                    “{styleDNA.vibe}”
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareVibe();
                  }}
                  style={{ 
                    background: t.accentInk, 
                    color: t.bg, 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Share ⚡
                </button>
              </div>
            </div>
          )}

          <div className="gen-surface-card" style={sectionCardStyle} data-reveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={sectionLabelStyle}>Tone / Vibe</div>
              {learnedVibe && (
                <div style={{ fontSize: 11, fontWeight: 700, color: t.accentInk, background: dark ? 'rgba(202,255,0,0.1)' : 'rgba(111,133,0,0.1)', padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>
                  We&apos;ve learned your vibe ⚡
                </div>
              )}
            </div>
            <div style={sectionHelpStyle}>Choose the mood first, then let the AI shape the language around it.</div>
            <div style={pillRowStyle}>
              {TONES.map((option) => (
                <button key={option} onClick={() => setTone(option)} style={getPillStyle(tone === option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div data-reveal>{mobileTemplateLibrary}</div>
        </div>

        <div ref={outputSectionRef} style={{ scrollMarginTop: 116 }}>
          {loading && (
            <div className="gen-state-shell gen-state-shell--loading gen-surface-card">
              <div className="gen-loading-shell" style={{ color: t.muted }}>
                <div className="gen-loading-kicker">Abhi likh raha hai</div>
                <div className="gen-loading-title">Lines abhi shape ho rahi hain...</div>
                <div className="gen-loading-copy">{loadingStateCopy}</div>
                <div className="gen-loading-stage">{LOADING_STEPS[loadingStageIndex]}</div>
                <div className="gen-loading-track" aria-hidden="true">
                  <span
                    className="gen-loading-progress"
                    style={{ transform: `scaleX(${(loadingStageIndex + 1) / LOADING_STEPS.length})` }}
                  />
                </div>
                <div className="gen-loading-steps" aria-hidden="true">
                  {LOADING_STEPS.map((step, index) => (
                    <span
                      key={step}
                      className={`gen-loading-step-chip${index === loadingStageIndex ? ' is-active' : ''}`}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showInlineError && <div className="gen-inline-error">{error}</div>}

          {showGenerationErrorCard && (
            <div
              className="gen-state-shell gen-state-shell--error gen-surface-card"
              style={{
                ...sectionCardStyle,
                marginTop: 40,
                border: `1px solid ${dark ? 'rgba(255,45,120,0.24)' : 'rgba(182,74,102,0.22)'}`,
                background: dark
                  ? 'linear-gradient(180deg, rgba(255,45,120,0.08) 0%, rgba(255,45,120,0.02) 100%), #111111'
                  : 'linear-gradient(180deg, rgba(182,74,102,0.10) 0%, rgba(182,74,102,0.03) 100%), #FFFCFA',
              }}
            >
              <div className="gen-empty-kicker" style={{ color: '#FF6A95', borderColor: dark ? 'rgba(255,106,149,0.24)' : 'rgba(182,74,102,0.22)', background: dark ? 'rgba(255,106,149,0.08)' : 'rgba(182,74,102,0.10)' }}>
                {errorCardKicker}
              </div>
              <div className="gen-empty-title" style={{ marginTop: 16 }}>
                {errorCardTitle}
              </div>
              <p className="gen-empty-copy" style={{ maxWidth: 680 }}>
                {error} Your prompt and settings are still here, so you can retry instantly or tweak the vibe first.
              </p>
              {quotaHelperCopy && (
                <p className="gen-empty-copy" style={{ maxWidth: 680, marginTop: 8 }}>
                  {quotaHelperCopy}
                </p>
              )}

              <div className="gen-empty-chip-row">
                <span className="gen-empty-chip">{platform}</span>
                <span className="gen-empty-chip">{length}</span>
                <span className="gen-empty-chip">{tone}</span>
                {normalizeSelectedOptions(selectedOptions).slice(0, 2).map((option) => (
                  <span key={option} className="gen-empty-chip gen-empty-chip--muted">{getOptionDisplayLabel(option)}</span>
                ))}
              </div>

              <div className="gen-state-actions">
                <button onClick={handleGenerate} disabled={controlsDisabled || !hasPrompt} style={primaryActionButtonStyle}>
                  Ek baar aur try karo
                </button>
                <button onClick={() => setError('')} style={actionButtonStyle}>
                  Theek hai
                </button>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="gen-empty-state gen-state-shell gen-state-shell--empty gen-surface-card" style={{ marginTop: 40 }}>
              <div className="gen-empty-kicker">Ready jab tum ho</div>
              <div className="gen-empty-title">{emptyStateTitle}</div>
              <p className="gen-empty-copy">{emptyStateCopy}</p>

              <div className="gen-empty-chip-row">
                <span className="gen-empty-chip">{platform}</span>
                <span className="gen-empty-chip">{length}</span>
                <span className="gen-empty-chip">{tone}</span>
                {normalizeSelectedOptions(selectedOptions).slice(0, 2).map((option) => (
                  <span key={option} className="gen-empty-chip gen-empty-chip--muted">{getOptionDisplayLabel(option)}</span>
                ))}
              </div>

              <div className="gen-empty-grid">
                {EMPTY_STATE_IDEAS.map((item) => (
                  <div key={item.title} className="gen-empty-card">
                    <div className="gen-empty-card-title">{item.title}</div>
                    <div className="gen-empty-card-copy">{item.copy}</div>
                  </div>
                ))}
              </div>

              <div className="gen-empty-note">
                {hasPrompt
                  ? 'Agar vibe visuals pe depend karti hai, toh generate karne se pehle image add ya screenshot paste bhi kar sakte ho.'
                  : 'Fast start chahiye toh template use karo ya image reference add karke shuru karo.'}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="gen-results-shell" data-scroll-top-hide-zone>
              <div className="gen-results-head">
                <div className="gen-results-head-main">
                  <div className="gen-results-kicker">Fresh options</div>
                  <div className="gen-results-title">Yeh lo {results.length} post-ready options</div>
                  <div className="gen-results-sub">
                    {resultsMetaCopy}
                  </div>
                </div>
                <div className="gen-results-actions">
                  <button onClick={handleCopyAll} style={{ ...actionButtonStyle, color: copiedAll ? t.accentInk : actionButtonStyle.color, border: copiedAll ? `1px solid ${t.accentInk}` : actionButtonStyle.border }}>
                    {copiedAll ? '✓ Sab copy ho gaya' : 'Sab copy karo'}
                  </button>
                  <button onClick={handleDownload} style={actionButtonStyle}>
                    .txt download karo
                  </button>
                </div>
              </div>

              {statusNotice && (
                <div className="gen-status-notice">
                  {statusNotice}
                </div>
              )}

              {results.map((item, index) => {
                const resultText = getResultText(item);
                const rewriteSuggestions = normalizeRewriteSuggestions(item?.rewriteSuggestions, visibleRewriteActions);
                const favoriteEntry = findFavoriteForResult(item);
                const isFavorite = Boolean(favoriteEntry);
                const resultCopyKey = `result-${index}`;

                return (
                  <div
                    className="gen-surface-card gen-result-card"
                    key={item.id || `${resultText}-${index}`}
                    style={{
                      background: t.resultBg,
                      border: `1px solid ${t.resultBorder}`,
                      borderRadius: 18,
                      padding: 20,
                      boxShadow: t.sectionShadow,
                      animationDelay: `${index * 0.08}s`,
                    }}
                  >
                    <div className="gen-result-card-head">
                      <div className={`gen-result-kicker${pendingResultAction?.index === index ? ' is-pending' : ''}`}>
                        {pendingResultAction?.index === index ? pendingResultAction.label : `Direction ${index + 1}`}
                      </div>
                      <div className="gen-result-actions">
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          aria-label={isFavorite ? 'Saved to favorites' : 'Save to favorites'}
                          title={isFavorite ? 'Saved to favorites' : 'Save to favorites'}
                          style={getResultIconButtonStyle({ active: isFavorite })}
                        >
                          {isFavorite ? <LuBookmarkCheck size={16} /> : <LuBookmark size={16} />}
                        </button>
                        <button
                          onClick={() => handleRegenerateOption(index)}
                          disabled={controlsDisabled}
                          aria-label={pendingResultAction?.index === index ? 'Refreshing result' : 'Regenerate result'}
                          title={pendingResultAction?.index === index ? 'Refreshing result' : 'Regenerate result'}
                          style={getResultIconButtonStyle({
                            active: pendingResultAction?.index === index && pendingResultAction.label === 'Refreshing...',
                            disabled: controlsDisabled,
                          })}
                        >
                          <LuRefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => handleCopy(resultText, resultCopyKey)}
                          aria-label={copied === resultCopyKey ? 'Copied' : 'Copy result'}
                          title={copied === resultCopyKey ? 'Copied' : 'Copy result'}
                          style={{ ...getResultIconButtonStyle({ active: copied === resultCopyKey }), fontSize: 0 }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {copied === resultCopyKey ? <LuCheck size={16} /> : <LuCopy size={16} />}
                          </span>
                          {copied === index ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <p className="gen-result-text">{resultText}</p>
                    <div className="gen-rewrite-bar" style={{ borderTop: `1px solid ${t.resultBorder}` }}>
                      <div className="gen-rewrite-label">Isko aur sharpen karo</div>
                      <div className="gen-rewrite-row">
                        {rewriteSuggestions.map((action) => (
                          <button
                            key={action.key}
                            onClick={() => handleRewriteOption(index, item, action)}
                            disabled={loading || pendingResultAction !== null}
                            style={rewriteButtonStyle(loading || pendingResultAction !== null)}
                          >
                            <span>{action.label}</span>
                            <span style={{ color: t.accentInk, fontSize: 12 }}>↗</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {favorites.length > 0 && (
          <div className="gen-collection-shell" data-reveal>
            <div className="gen-collection-head">
              <div>
                <div className="gen-collection-title">Saved picks</div>
                <div className="gen-collection-copy">
                  Tumhari strongest saved lines, sirf isi browser mein.
                </div>
              </div>
              <button onClick={handleClearFavorites} style={actionButtonStyle}>Favorites clear karo</button>
            </div>

            <div className="gen-collection-grid">
              {favorites.map((entry) => {
                const favoriteCopyKey = `favorite-${entry.id}`;

                return (
                  <div
                    className="gen-surface-card gen-surface-card--subtle"
                    key={entry.id}
                    style={{
                      background:
                        dark
                          ? 'linear-gradient(180deg, rgba(202,255,0,0.06) 0%, rgba(202,255,0,0) 100%), #111111'
                          : 'linear-gradient(180deg, rgba(147,181,0,0.10) 0%, rgba(147,181,0,0) 100%), #FFFFFF',
                      border: `1px solid ${dark ? 'rgba(202,255,0,0.14)' : '#D8D6D0'}`,
                      borderRadius: 16,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: t.sectionShadow,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: t.accentInk, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Favorite pick
                        </div>
                        <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
                          {formatHistoryTime(entry.createdAt)} · {entry.platform || 'Auto Detect'} · {entry.tone || 'Aesthetic'}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFavorite(entry.id)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                        ×
                      </button>
                    </div>

                    <div style={{ fontSize: 15, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {entry.text}
                    </div>

                    <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.6 }}>
                      From: {entry.input || 'Saved result'}{entry.hadImage ? ' · Image-based' : ''}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                      <button onClick={() => handleUseFavorite(entry)} style={actionButtonStyle}>
                        Dobara use karo
                      </button>
                      <button onClick={() => handleCopy(entry.text, favoriteCopyKey)} style={{ ...actionButtonStyle, color: copied === favoriteCopyKey ? t.accentInk : actionButtonStyle.color, border: copied === favoriteCopyKey ? `1px solid ${t.accentInk}` : actionButtonStyle.border }}>
                        {copied === favoriteCopyKey ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="gen-collection-shell" data-reveal>
            <div className="gen-collection-head">
              <div>
                <div className="gen-collection-title">Recent runs</div>
                <div className="gen-collection-copy">
                  Isi browser mein saved, tumhari latest working stacks ke saath.
                </div>
              </div>
              <button onClick={handleClearHistory} style={actionButtonStyle}>History clear karo</button>
            </div>

            <div className="gen-history-list">
              {history.map((entry) => (
                <div className="gen-surface-card gen-surface-card--subtle gen-history-card" key={entry.id} style={{ background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 16, padding: 16, boxShadow: t.sectionShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6, fontWeight: 600 }}>{entry.input}</div>
                      <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
                        {formatHistoryTime(entry.createdAt)} · {entry.platform || 'Auto Detect'} · {entry.length || 'Medium'} · {entry.tone || 'Aesthetic'}{entry.hadImage ? ' · Image-based' : ''}
                      </div>
                    </div>
                    <button onClick={() => handleRestoreHistory(entry)} style={{ ...actionButtonStyle, alignSelf: 'flex-start' }}>
                      Dobara use karo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="gen-footer" style={{ borderTop: `1px solid ${t.border}` }}>
          <div className="gen-footer-meta">
            <div className="gen-footer-text">Post karne se pehle AI output ek baar review kar lo.</div>
            <span className="site-version-badge">
              <span className="site-version-prefix">{siteVersionPrefix}</span>
              <span className="site-version-number">{siteVersion}</span>
            </span>
          </div>
          <div className="gen-footer-links">
            <Link href="/privacy" className="gen-footer-link">Privacy</Link>
            <Link href="/terms" className="gen-footer-link">Terms</Link>
            <Link href="/contact" className="gen-footer-link">Contact</Link>
            <Link href="/faq" className="gen-footer-link">FAQ</Link>
          </div>
        </footer>
      </div>

      {toast ? (
        <div className="gen-toast-stack" aria-live="polite" aria-atomic="true">
          <div className={`gen-toast gen-toast--${toast.tone}`} key={toast.id}>
            <span className="gen-toast-icon">
              <LuCheck size={14} />
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}

      {isRevealModalOpen && styleDNA && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            maxWidth: 420,
            width: '100%',
            background: '#0a0a0a',
            border: `1px solid ${t.accentInk}33`,
            borderRadius: 32,
            padding: 40,
            textAlign: 'center',
            boxShadow: `0 0 80px ${t.accentInk}11`,
            animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>⚡</div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: 32, 
              fontWeight: 800, 
              color: '#fff',
              marginBottom: 8,
              letterSpacing: -1
            }}>
              We figured you out.
            </h2>
            <p style={{ color: t.muted, fontSize: 16, marginBottom: 32 }}>
              Your writing style is now part of Likhle&apos;s memory.
            </p>

            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: 24, 
              padding: 24, 
              marginBottom: 32,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              textAlign: 'left'
            }}>
              {[
                { label: 'Tone', value: styleDNA.tone },
                { label: 'Language', value: styleDNA.language },
                { label: 'Emoji Style', value: styleDNA.emoji },
                { label: 'Structure', value: styleDNA.structure },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: 20, 
              fontWeight: 800, 
              color: t.accentInk,
              marginBottom: 40,
              lineHeight: 1.2
            }}>
              “Ab hum tere style mein likhenge.”
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={dismissReveal}
                style={{ 
                  background: t.accentInk, 
                  color: '#000', 
                  border: 'none', 
                  height: 56, 
                  borderRadius: 16, 
                  fontSize: 16, 
                  fontWeight: 800, 
                  cursor: 'pointer' 
                }}
              >
                Let&apos;s go
              </button>
              <button 
                onClick={() => {
                  handleShareVibe();
                  dismissReveal();
                }}
                style={{ 
                  background: 'transparent', 
                  color: t.muted, 
                  border: 'none', 
                  height: 40, 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Share My Vibe ⚡
              </button>
            </div>
          </div>
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
