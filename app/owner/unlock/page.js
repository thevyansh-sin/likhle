'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LuArrowRight, LuShieldCheck, LuShieldEllipsis, LuShieldOff } from 'react-icons/lu';

function formatExpiry(value) {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function OwnerUnlockPage() {
  const [secret, setSecret] = useState('');
  const [ownerState, setOwnerState] = useState({
    active: false,
    configured: true,
    expiresAt: null,
    loaded: false,
  });
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState({
    tone: 'neutral',
    text: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerState() {
      try {
        const response = await fetch('/api/owner/status', {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        setOwnerState({
          active: Boolean(data.active),
          configured: Boolean(data.configured),
          expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
          loaded: true,
        });
      } catch {
        if (!cancelled) {
          setOwnerState({
            active: false,
            configured: false,
            expiresAt: null,
            loaded: true,
          });
        }
      }
    }

    loadOwnerState();

    return () => {
      cancelled = true;
    };
  }, []);

  const expiryLabel = formatExpiry(ownerState.expiresAt);

  async function refreshOwnerState() {
    const response = await fetch('/api/owner/status', {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    setOwnerState({
      active: Boolean(data.active),
      configured: Boolean(data.configured),
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
      loaded: true,
    });
  }

  async function handleUnlock(event) {
    event.preventDefault();

    if (!secret.trim()) {
      setFeedback({
        tone: 'error',
        text: 'Paste your owner secret first.',
      });
      return;
    }

    setPending(true);
    setFeedback({
      tone: 'neutral',
      text: '',
    });

    try {
      const response = await fetch('/api/owner/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unlock failed.');
      }

      setSecret('');
      setFeedback({
        tone: 'success',
        text: 'Owner mode is active on this browser for the next 30 days.',
      });
      window.dispatchEvent(new CustomEvent('likhle-owner-mode-change'));
      await refreshOwnerState();
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error.message || 'Unlock failed.',
      });
    } finally {
      setPending(false);
    }
  }

  async function handleTurnOff() {
    setPending(true);
    setFeedback({
      tone: 'neutral',
      text: '',
    });

    try {
      const response = await fetch('/api/owner/unlock', {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Could not turn owner mode off.');
      }

      setFeedback({
        tone: 'success',
        text: 'Owner mode is off on this browser now.',
      });
      window.dispatchEvent(new CustomEvent('likhle-owner-mode-change'));
      await refreshOwnerState();
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error.message || 'Could not turn owner mode off.',
      });
    } finally {
      setPending(false);
    }
  }

  const stateLabel = ownerState.active
    ? 'Owner mode active'
    : ownerState.configured
      ? 'Owner mode locked'
      : 'Owner mode not configured';
  const stateCopy = !ownerState.loaded
    ? 'Checking whether this browser is already unlocked.'
    : ownerState.active
      ? `This browser is unlocked${expiryLabel ? ` until ${expiryLabel}` : ''}. Generate and rewrite requests will skip app-side rate limits and cooldowns here.`
      : ownerState.configured
        ? 'Unlock this hidden page once on your own browser. After that, the site treats only this browser as the owner device.'
        : 'This deployment still needs an OWNER_MODE_TOKEN environment variable before the hidden unlock can work.';

  return (
    <div className="owner-unlock-page">
      <div className="owner-unlock-shell">
        <div className="owner-unlock-kicker">Hidden owner controls</div>
        <div className="owner-unlock-title">Unlock your browser as the Likhle owner device.</div>
        <p className="owner-unlock-copy">
          Use this only on your own browser. Once unlocked, this device skips Likhle&apos;s app-side
          testing waits while regular users keep the normal protection.
        </p>

        <div className="owner-unlock-status-card">
          <div className="owner-unlock-status-head">
            <span className={`owner-unlock-status-icon${ownerState.active ? ' is-active' : ''}`}>
              {ownerState.active ? <LuShieldCheck size={18} /> : <LuShieldEllipsis size={18} />}
            </span>
            <div>
              <div className="owner-unlock-status-label">{stateLabel}</div>
              <div className="owner-unlock-status-copy">{stateCopy}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="owner-unlock-form">
          <label className="owner-unlock-field">
            <span className="owner-unlock-field-label">Owner secret</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck="false"
              className="owner-unlock-input"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Paste the hidden owner token"
              disabled={pending || !ownerState.configured}
            />
          </label>

          <div className="owner-unlock-actions">
            <button
              type="submit"
              className="owner-unlock-primary"
              disabled={pending || !ownerState.configured}
            >
              {pending ? 'Unlocking...' : 'Unlock owner mode'}
            </button>
            {ownerState.active ? (
              <button
                type="button"
                className="owner-unlock-secondary"
                onClick={handleTurnOff}
                disabled={pending}
              >
                <LuShieldOff size={16} />
                Turn off
              </button>
            ) : null}
            <Link href="/generate" className="owner-unlock-link">
              Open generator <LuArrowRight size={14} />
            </Link>
          </div>
        </form>

        {feedback.text ? (
          <div className={`owner-unlock-feedback owner-unlock-feedback--${feedback.tone}`}>
            {feedback.text}
          </div>
        ) : null}

        <div className="owner-unlock-note-grid">
          <div className="owner-unlock-note">
            <div className="owner-unlock-note-title">What it skips</div>
            <div className="owner-unlock-note-copy">
              Likhle&apos;s own rate limit and per-session cooldown for generate and rewrite clicks.
            </div>
          </div>
          <div className="owner-unlock-note">
            <div className="owner-unlock-note-title">What it cannot skip</div>
            <div className="owner-unlock-note-copy">
              External Groq or Gemini provider quota pauses. Those still belong to the AI providers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
