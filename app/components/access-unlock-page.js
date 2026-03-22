'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LuArrowRight, LuShieldCheck, LuShieldEllipsis, LuShieldOff } from 'react-icons/lu';

const ACCESS_MODE_UI = {
  owner: {
    mode: 'owner',
    label: 'Owner',
    durationLabel: '30 days',
    routeBase: '/owner',
    unlockPath: '/owner/unlock',
    eventName: 'likhle-owner-mode-change',
    kicker: 'Hidden owner controls',
    title: 'Unlock your browser as the Likhle owner device.',
    copy:
      "Use this only on your own browser. Once unlocked, this device skips Likhle's app-side testing waits while regular users keep the normal protection.",
    activeLabel: 'Owner mode active',
    lockedLabel: 'Owner mode locked',
    unconfiguredLabel: 'Owner mode not configured',
    lockedCopy:
      'Unlock this hidden page once on your own browser. After that, the site treats only this browser as the owner device.',
    unconfiguredCopy:
      'This deployment still needs an OWNER_MODE_TOKEN environment variable before the hidden unlock can work.',
    activeCopyPrefix: 'This browser is unlocked',
    secretLabel: 'Owner secret',
    secretPlaceholder: 'Paste the hidden owner token',
    unlockButtonLabel: 'Unlock owner mode',
    unlockPendingLabel: 'Unlocking...',
    unlockSuccessText: 'Owner mode is active on this browser for the next 30 days.',
    turnOffSuccessText: 'Owner mode is off on this browser now.',
  },
  admin: {
    mode: 'admin',
    label: 'Admin',
    durationLabel: '10 days',
    routeBase: '/admin',
    unlockPath: '/admin/unlock',
    eventName: 'likhle-admin-mode-change',
    kicker: 'Hidden admin controls',
    title: 'Unlock this browser as a Likhle admin tester device.',
    copy:
      "Use this only on a trusted tester browser. Once unlocked, this device skips Likhle's app-side testing waits without exposing the owner secret.",
    activeLabel: 'Admin mode active',
    lockedLabel: 'Admin mode locked',
    unconfiguredLabel: 'Admin mode not configured',
    lockedCopy:
      'Unlock this hidden page once on a trusted tester browser. After that, the site treats only that browser as an approved admin tester device.',
    unconfiguredCopy:
      'This deployment still needs an ADMIN_MODE_TOKEN environment variable before the hidden unlock can work.',
    activeCopyPrefix: 'This trusted tester browser is unlocked',
    secretLabel: 'Admin secret',
    secretPlaceholder: 'Paste the hidden admin token',
    unlockButtonLabel: 'Unlock admin mode',
    unlockPendingLabel: 'Unlocking...',
    unlockSuccessText: 'Admin mode is active on this browser for the next 10 days.',
    turnOffSuccessText: 'Admin mode is off on this browser now.',
  },
};

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

function dispatchAccessModeEvents(eventName) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName));
  window.dispatchEvent(new CustomEvent('likhle-access-mode-change'));
}

export default function AccessUnlockPage({ mode = 'owner' }) {
  const accessMode = useMemo(() => ACCESS_MODE_UI[mode] || ACCESS_MODE_UI.owner, [mode]);
  const [secret, setSecret] = useState('');
  const [accessState, setAccessState] = useState({
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

    async function loadAccessState() {
      try {
        const response = await fetch(`/api/${accessMode.mode}/status`, {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        setAccessState({
          active: Boolean(data.active),
          configured: Boolean(data.configured),
          expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
          loaded: true,
        });
      } catch {
        if (!cancelled) {
          setAccessState({
            active: false,
            configured: false,
            expiresAt: null,
            loaded: true,
          });
        }
      }
    }

    loadAccessState();

    return () => {
      cancelled = true;
    };
  }, [accessMode.mode]);

  const expiryLabel = formatExpiry(accessState.expiresAt);

  async function refreshAccessState() {
    const response = await fetch(`/api/${accessMode.mode}/status`, {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    setAccessState({
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
        text: `Paste your ${accessMode.label.toLowerCase()} secret first.`,
      });
      return;
    }

    setPending(true);
    setFeedback({
      tone: 'neutral',
      text: '',
    });

    try {
      const response = await fetch(`/api/${accessMode.mode}/unlock`, {
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
        text: accessMode.unlockSuccessText,
      });
      dispatchAccessModeEvents(accessMode.eventName);
      await refreshAccessState();
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
      const response = await fetch(`/api/${accessMode.mode}/unlock`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Could not turn ${accessMode.label.toLowerCase()} mode off.`);
      }

      setFeedback({
        tone: 'success',
        text: accessMode.turnOffSuccessText,
      });
      dispatchAccessModeEvents(accessMode.eventName);
      await refreshAccessState();
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error.message || `Could not turn ${accessMode.label.toLowerCase()} mode off.`,
      });
    } finally {
      setPending(false);
    }
  }

  const stateLabel = accessState.active
    ? accessMode.activeLabel
    : accessState.configured
      ? accessMode.lockedLabel
      : accessMode.unconfiguredLabel;
  const stateCopy = !accessState.loaded
    ? 'Checking whether this browser is already unlocked.'
    : accessState.active
      ? `${accessMode.activeCopyPrefix}${expiryLabel ? ` until ${expiryLabel}` : ''}. Generate and rewrite requests will skip app-side rate limits and cooldowns here.`
      : accessState.configured
        ? accessMode.lockedCopy
        : accessMode.unconfiguredCopy;

  return (
    <div className="owner-unlock-page">
      <div className="owner-unlock-shell">
        <div className="owner-unlock-kicker">{accessMode.kicker}</div>
        <div className="owner-unlock-title">{accessMode.title}</div>
        <p className="owner-unlock-copy">{accessMode.copy}</p>

        <div className="owner-unlock-status-card">
          <div className="owner-unlock-status-head">
            <span className={`owner-unlock-status-icon${accessState.active ? ' is-active' : ''}`}>
              {accessState.active ? <LuShieldCheck size={18} /> : <LuShieldEllipsis size={18} />}
            </span>
            <div>
              <div className="owner-unlock-status-label">{stateLabel}</div>
              <div className="owner-unlock-status-copy">{stateCopy}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="owner-unlock-form">
          <label className="owner-unlock-field">
            <span className="owner-unlock-field-label">{accessMode.secretLabel}</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck="false"
              className="owner-unlock-input"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={accessMode.secretPlaceholder}
              disabled={pending || !accessState.configured}
            />
          </label>

          <div className="owner-unlock-actions">
            <button
              type="submit"
              className="owner-unlock-primary"
              disabled={pending || !accessState.configured}
            >
              {pending ? accessMode.unlockPendingLabel : accessMode.unlockButtonLabel}
            </button>
            {accessState.active ? (
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
