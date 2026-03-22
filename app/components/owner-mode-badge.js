'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LuShieldCheck } from 'react-icons/lu';

const ACCESS_BADGE_CONFIG = {
  owner: {
    label: 'Owner mode active',
    notePrefix: 'This browser skips testing waits',
    href: '/owner/unlock',
    ariaLabel: 'Owner mode active. Open owner controls.',
    title: 'Owner mode active',
  },
  admin: {
    label: 'Admin mode active',
    notePrefix: 'This trusted tester browser skips testing waits',
    href: '/admin/unlock',
    ariaLabel: 'Admin mode active. Open admin controls.',
    title: 'Admin mode active',
  },
};

function formatAccessExpiry(value) {
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

async function loadModeState(mode) {
  try {
    const response = await fetch(`/api/${mode}/status`, {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    return {
      active: Boolean(data.active),
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
    };
  } catch {
    return {
      active: false,
      expiresAt: null,
    };
  }
}

export default function OwnerModeBadge() {
  const pathname = usePathname();
  const [accessState, setAccessState] = useState({
    active: false,
    mode: null,
    expiresAt: null,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAccessState() {
      const [ownerState, adminState] = await Promise.all([
        loadModeState('owner'),
        loadModeState('admin'),
      ]);

      if (cancelled) {
        return;
      }

      const nextState = ownerState.active
        ? {
            active: true,
            mode: 'owner',
            expiresAt: ownerState.expiresAt,
            loaded: true,
          }
        : adminState.active
          ? {
              active: true,
              mode: 'admin',
              expiresAt: adminState.expiresAt,
              loaded: true,
            }
          : {
              active: false,
              mode: null,
              expiresAt: null,
              loaded: true,
            };

      setAccessState(nextState);
    }

    loadAccessState();

    const handleAccessModeChange = () => {
      loadAccessState();
    };

    window.addEventListener('likhle-owner-mode-change', handleAccessModeChange);
    window.addEventListener('likhle-admin-mode-change', handleAccessModeChange);
    window.addEventListener('likhle-access-mode-change', handleAccessModeChange);

    return () => {
      cancelled = true;
      window.removeEventListener('likhle-owner-mode-change', handleAccessModeChange);
      window.removeEventListener('likhle-admin-mode-change', handleAccessModeChange);
      window.removeEventListener('likhle-access-mode-change', handleAccessModeChange);
    };
  }, [pathname]);

  const activeConfig = useMemo(
    () => (accessState.mode ? ACCESS_BADGE_CONFIG[accessState.mode] : null),
    [accessState.mode]
  );
  const expiryLabel = accessState.active ? formatAccessExpiry(accessState.expiresAt) : '';

  if (!accessState.loaded || !accessState.active || !activeConfig) {
    return null;
  }

  return (
    <Link
      href={activeConfig.href}
      className={`owner-mode-badge${
        accessState.mode === 'admin' ? ' owner-mode-badge--admin' : ''
      }`}
      aria-label={activeConfig.ariaLabel}
      title={activeConfig.title}
    >
      <span className="owner-mode-badge-icon">
        <LuShieldCheck size={14} />
      </span>
      <span className="owner-mode-badge-copy">
        <span className="owner-mode-badge-label">{activeConfig.label}</span>
        <span className="owner-mode-badge-note">
          {activeConfig.notePrefix}
          {expiryLabel ? ` until ${expiryLabel}` : ''}.
        </span>
      </span>
    </Link>
  );
}
