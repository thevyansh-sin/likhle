'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LuBookmark,
  LuBookmarkCheck,
  LuCheck,
  LuCopy,
  LuImage,
  LuPlus,
  LuRefreshCw,
} from 'react-icons/lu';
import { siteVersionLabel } from '../lib/site';
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
const OPTIONS = ['Hinglish 🇮🇳', 'Add Emojis ✨', 'Add Hashtags #'];
const DEFAULT_OPTIONS = ['Add Emojis ✨', 'Add Hashtags #'];
const PLATFORM_OPTIONS = [
  'Auto Detect',
  'Instagram Caption',
  'Instagram Bio',
  'Reels Hook',
  'WhatsApp Status',
  'LinkedIn Bio',
  'Twitter/X Bio',
];
const LENGTH_OPTIONS = ['Short', 'Medium', 'Long'];
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

function getRewriteActionsForContext({ tone, selectedOptions }) {
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

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [tone, setTone] = useState('Aesthetic');
  const [platform, setPlatform] = useState('Auto Detect');
  const [length, setLength] = useState('Medium');
  const [selectedOptions, setSelectedOptions] = useState(DEFAULT_OPTIONS);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingResultAction, setPendingResultAction] = useState(null);
  const [copied, setCopied] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [dark, setDark] = useState(true);
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
  const fileRef = useRef(null);

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

      setSelectedOptions(nextOptions);
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
    borderRadius: 18,
    padding: 18,
    boxShadow: t.sectionShadow,
  };

  const sectionLabelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: t.muted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  const sectionHelpStyle = {
    fontSize: 13,
    color: t.muted,
    lineHeight: 1.5,
    marginTop: 6,
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
    transition: 'all 0.15s ease',
    fontWeight: isActive ? 700 : 500,
    boxShadow: isActive ? t.chipShadow : 'none',
  });

  const toggleOption = (option) => {
    setSelectedOptions((previousOptions) =>
      previousOptions.includes(option)
        ? previousOptions.filter((item) => item !== option)
        : [...previousOptions, option]
    );
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

    return nextOptions;
  };

  const handleApplyTemplate = (template) => {
    setInput(template.prompt);
    setPlatform(template.platform);
    setTone(template.tone);
    setLength(template.length);
    setSelectedOptions(getTemplateOptions(template));
    setResults([]);
    setError('');
    setSessionId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const applyAttachment = (file) => {
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
    return true;
  };

  const syncHistory = (nextResults, nextId) => {
    const historyId = nextId || sessionId || `likhle-${Date.now()}`;
    const normalizedResults = normalizeResultItems(nextResults, visibleRewriteActions).map((item) => ({
      text: item.text,
      rewriteSuggestions: item.rewriteSuggestions.map((suggestion) => ({
        label: suggestion.label,
        instruction: suggestion.instruction,
      })),
    }));
    const entry = {
      id: historyId,
      input: input.trim(),
      tone,
      platform,
      length,
      selectedOptions: [...selectedOptions],
      results: normalizedResults,
      createdAt: Date.now(),
      hadImage: Boolean(attachment),
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
    selectedOptions: [...selectedOptions],
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
      return;
    }

    const nextFavorite = buildFavoriteEntry(resultItem);
    setFavorites((previousFavorites) => [nextFavorite, ...previousFavorites].slice(0, MAX_FAVORITES_ITEMS));
  };

  const handleUseFavorite = (entry) => {
    setInput(entry.input || '');
    setTone(entry.tone || 'Aesthetic');
    setPlatform(entry.platform || 'Auto Detect');
    setLength(entry.length || 'Medium');
    setSelectedOptions(
      Array.isArray(entry.selectedOptions) && entry.selectedOptions.length > 0
        ? entry.selectedOptions
        : DEFAULT_OPTIONS
    );
    setResults(
      entry.text
        ? normalizeResultItems(
            [{ text: entry.text, rewriteSuggestions: entry.rewriteSuggestions || [] }],
            getRewriteActionsForContext({
              tone: entry.tone || 'Aesthetic',
              selectedOptions:
                Array.isArray(entry.selectedOptions) && entry.selectedOptions.length > 0
                  ? entry.selectedOptions
                  : DEFAULT_OPTIONS,
            })
          )
        : []
    );
    setSessionId('');
    setAttachment(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildRequestFormData = ({
    count = 4,
    avoidResults = [],
    rewriteAction = '',
    rewriteInstruction = '',
    currentResult = '',
  } = {}) => {
    const hinglish = selectedOptions.includes('Hinglish 🇮🇳');
    const emoji = selectedOptions.includes('Add Emojis ✨');
    const hashtags = selectedOptions.includes('Add Hashtags #');
    const formData = new FormData();

    formData.append('input', input.trim());
    formData.append('tone', tone);
    formData.append('platform', platform);
    formData.append('length', length);
    formData.append('count', String(count));
    formData.append('hinglish', String(hinglish));
    formData.append('emoji', String(emoji));
    formData.append('hashtags', String(hashtags));

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

    if (attachment) {
      formData.append('image', attachment);
    }

    return formData;
  };

  const requestGeneration = async ({
    count = 4,
    resultIndex = null,
    avoidResults = [],
    rewriteAction = '',
    rewriteInstruction = '',
    currentResult = '',
    pendingLabel = 'Refreshing...',
  } = {}) => {
    if (!input.trim()) {
      return null;
    }

    if (attachment) {
      const validationError = validateAttachment(attachment);

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

    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: buildRequestFormData({ count, avoidResults, rewriteAction, rewriteInstruction, currentResult }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Kuch gadbad ho gayi 😅 Try again!');
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

  const handleFile = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    applyAttachment(file);
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
    applyAttachment(pastedImage);
  };

  const handleGenerate = async () => {
    const nextResults = await requestGeneration({ count: 4 });

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
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Copy nahi hua. Ek baar aur try karo.');
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.map((item) => getResultText(item)).join('\n\n'));
      setCopiedAll(true);
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
      `Options: ${selectedOptions.join(', ') || 'None'}`,
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
  };

  const handleRestoreHistory = (entry) => {
    setInput(entry.input || '');
    setTone(entry.tone || 'Aesthetic');
    setPlatform(entry.platform || 'Auto Detect');
    setLength(entry.length || 'Medium');
    setSelectedOptions(
      Array.isArray(entry.selectedOptions) && entry.selectedOptions.length > 0
        ? entry.selectedOptions
        : DEFAULT_OPTIONS
    );
    setResults(
      normalizeResultItems(
        Array.isArray(entry.results) ? entry.results : [],
        getRewriteActionsForContext({
          tone: entry.tone || 'Aesthetic',
          selectedOptions:
            Array.isArray(entry.selectedOptions) && entry.selectedOptions.length > 0
              ? entry.selectedOptions
              : DEFAULT_OPTIONS,
        })
      )
    );
    setSessionId(entry.id || '');
    setAttachment(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveFavorite = (id) => {
    setFavorites((previousFavorites) => previousFavorites.filter((entry) => entry.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSessionId('');
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const handleClearFavorites = () => {
    setFavorites([]);
    window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
  };

  const actionButtonStyle = {
    background: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      : 'linear-gradient(180deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.01) 100%)',
    border: `1px solid ${t.resultBorder}`,
    color: t.copyText,
    fontSize: 12,
    fontWeight: 600,
    padding: '9px 14px',
    borderRadius: 14,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '0.01em',
  };

  const rewriteButtonStyle = (disabled) => ({
    background: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      : 'linear-gradient(180deg, rgba(17,17,17,0.03) 0%, rgba(17,17,17,0.01) 100%)',
    border: `1px solid ${t.resultBorder}`,
    color: t.copyText,
    fontSize: 11,
    fontWeight: 600,
    padding: '10px 12px',
    borderRadius: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
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

  const renderTemplateCard = (template, compact = false) => (
    <button
      key={template.id}
      onClick={() => handleApplyTemplate(template)}
      style={{
        background: t.resultBg,
        border: `1px solid ${t.resultBorder}`,
        borderRadius: 16,
        padding: compact ? 14 : 16,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        minWidth: compact ? 'min(78vw, 260px)' : 'min(82vw, 280px)',
        boxShadow: t.sectionShadow,
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 14, background: t.attBg, border: `1px solid ${t.attBorder}`, borderRadius: 16, padding: 14, boxShadow: t.sectionShadow }}>
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

      <div style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 16, padding: '18px 20px 14px', boxShadow: t.sectionShadow }}>
        <textarea
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
    <div style={sectionCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={sectionLabelStyle}>Quick Start Templates</div>
          <div style={sectionHelpStyle}>
            Use one if you want a head start, but keep the main controls right above for fast edits.
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
        <div style={{ marginBottom: 48 }}>
          <h1 className="gen-page-title" style={{ color: t.text, marginBottom: 8 }}>Kya likhna hai? ✍️</h1>
          <p style={{ fontSize: 16, color: t.muted }}>Describe karo — AI sab samajh leta hai.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {composerPanel}

          <div style={sectionCardStyle}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div style={sectionCardStyle}>
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

            <div style={sectionCardStyle}>
              <div style={sectionLabelStyle}>Options</div>
              <div style={sectionHelpStyle}>Turn on extras like Hinglish, emojis, or hashtags.</div>
              <div style={pillRowStyle}>
                {OPTIONS.map((option) => (
                  <button key={option} onClick={() => toggleOption(option)} style={getPillStyle(selectedOptions.includes(option))}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionLabelStyle}>Tone / Vibe</div>
            <div style={sectionHelpStyle}>Choose the mood first, then let the AI shape the language around it.</div>
            <div style={pillRowStyle}>
              {TONES.map((option) => (
                <button key={option} onClick={() => setTone(option)} style={getPillStyle(tone === option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {mobileTemplateLibrary}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: t.muted, fontSize: 15 }}>
            <div>AI likh raha hai... ✨</div>
            <div style={{ display: 'inline-flex', gap: 6, marginTop: 12 }}>
              {[0, 1, 2].map((index) => <div key={index} style={{ width: 8, height: 8, background: t.accent, borderRadius: '50%', animation: `bounce 1s infinite ${index * 0.15}s` }} />)}
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 24, color: '#FF2D78', fontSize: 14, textAlign: 'center' }}>{error}</div>}

        {results.length > 0 && (
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>Yeh lo {results.length} options 🔥</div>
                <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>
                  {platform} · {length} · {tone}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handleCopyAll} style={{ ...actionButtonStyle, color: copiedAll ? t.accentInk : actionButtonStyle.color, border: copiedAll ? `1px solid ${t.accentInk}` : actionButtonStyle.border }}>
                  {copiedAll ? '✓ Copied all' : 'Copy all'}
                </button>
                <button onClick={handleDownload} style={actionButtonStyle}>
                  Download .txt
                </button>
              </div>
            </div>

            {results.map((item, index) => {
              const resultText = getResultText(item);
              const rewriteSuggestions = normalizeRewriteSuggestions(item?.rewriteSuggestions, visibleRewriteActions);
              const favoriteEntry = findFavoriteForResult(item);
              const isFavorite = Boolean(favoriteEntry);
              const resultCopyKey = `result-${index}`;

              return (
                <div key={item.id || `${resultText}-${index}`} style={{ background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 18, padding: 20, boxShadow: t.sectionShadow }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div style={{ minHeight: 18 }}>
                    {pendingResultAction?.index === index ? (
                      <div style={{ fontSize: 12, color: t.accentInk, fontWeight: 600 }}>
                        {pendingResultAction.label}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: t.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Option {index + 1}
                      </div>
                    )}
                  </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
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
                <p style={{ fontSize: 15, lineHeight: 1.75, color: t.text, whiteSpace: 'pre-wrap' }}>{resultText}</p>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.resultBorder}` }}>
                  <div style={{ fontSize: 12, color: t.muted, marginBottom: 10 }}>Quick rewrite</div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'nowrap',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      paddingBottom: 2,
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
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
          <div style={{ marginTop: 56, borderTop: `1px solid ${t.border}`, paddingTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>Favorites</div>
                <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>
                  Your best saved lines, kept only in this browser.
                </div>
              </div>
              <button onClick={handleClearFavorites} style={actionButtonStyle}>Clear favorites</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
              {favorites.map((entry) => {
                const favoriteCopyKey = `favorite-${entry.id}`;

                return (
                  <div
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
                        Use again
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

        {history.length > 0 && (
          <div style={{ marginTop: 56, borderTop: `1px solid ${t.border}`, paddingTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>Recent history</div>
                <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>
                  Saved only in this browser with your latest results.
                </div>
              </div>
              <button onClick={handleClearHistory} style={actionButtonStyle}>Clear history</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {history.map((entry) => (
                <div key={entry.id} style={{ background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 16, padding: 16, boxShadow: t.sectionShadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6, fontWeight: 600 }}>{entry.input}</div>
                      <div style={{ fontSize: 12, color: t.muted, marginTop: 8 }}>
                        {formatHistoryTime(entry.createdAt)} · {entry.platform || 'Auto Detect'} · {entry.length || 'Medium'} · {entry.tone || 'Aesthetic'}{entry.hadImage ? ' · Image-based' : ''}
                      </div>
                    </div>
                    <button onClick={() => handleRestoreHistory(entry)} style={{ ...actionButtonStyle, alignSelf: 'flex-start' }}>
                      Use again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 56, paddingTop: 24, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: t.muted }}>Use Likhle thoughtfully and review AI output before posting.</div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: t.accentInk,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${t.border}`,
                background: t.resultBg,
              }}
            >
              {siteVersionLabel}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ fontSize: 13, color: t.muted, textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: t.muted, textDecoration: 'none' }}>Terms</Link>
            <Link href="/contact" style={{ fontSize: 13, color: t.muted, textDecoration: 'none' }}>Contact</Link>
            <Link href="/faq" style={{ fontSize: 13, color: t.muted, textDecoration: 'none' }}>FAQ</Link>
          </div>
        </footer>
      </div>

    </div>
  );
}
