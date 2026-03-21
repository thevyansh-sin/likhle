'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuShieldCheck } from 'react-icons/lu';

function formatOwnerExpiry(value) {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function OwnerModeBadge() {
  const pathname = usePathname();
  const [ownerState, setOwnerState] = useState({
    active: false,
    expiresAt: null,
    loaded: false,
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
          expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
          loaded: true,
        });
      } catch {
        if (!cancelled) {
          setOwnerState({
            active: false,
            expiresAt: null,
            loaded: true,
          });
        }
      }
    }

    loadOwnerState();

    const handleOwnerModeChange = () => {
      loadOwnerState();
    };

    window.addEventListener('likhle-owner-mode-change', handleOwnerModeChange);

    return () => {
      cancelled = true;
      window.removeEventListener('likhle-owner-mode-change', handleOwnerModeChange);
    };
  }, [pathname]);

  const expiryLabel = ownerState.active ? formatOwnerExpiry(ownerState.expiresAt) : '';

  if (!ownerState.loaded || !ownerState.active) {
    return null;
  }

  return (
    <Link
      href="/owner/unlock"
      className="owner-mode-badge"
      aria-label="Owner mode active. Open owner controls."
      title="Owner mode active"
    >
      <span className="owner-mode-badge-icon">
        <LuShieldCheck size={14} />
      </span>
      <span className="owner-mode-badge-copy">
        <span className="owner-mode-badge-label">Owner mode active</span>
        <span className="owner-mode-badge-note">
          This browser skips testing waits{expiryLabel ? ` until ${expiryLabel}` : ''}.
        </span>
      </span>
    </Link>
  );
}
