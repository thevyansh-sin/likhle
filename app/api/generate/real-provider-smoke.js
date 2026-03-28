const REAL_PROVIDER_SMOKE_ENABLED = process.env.LIKHLE_REAL_PROVIDER_SMOKE === '1';

const VALID_SMOKE_MODES = new Set(['success', 'fallback', 'timeout', 'budget']);

export function getRealProviderSmokeMode(request) {
  if (!REAL_PROVIDER_SMOKE_ENABLED) {
    return null;
  }

  const rawMode = request?.headers?.get?.('x-likhle-provider-smoke') || '';
  const normalizedMode = rawMode.trim().toLowerCase();

  return VALID_SMOKE_MODES.has(normalizedMode) ? normalizedMode : null;
}

export function getSmokeProviderBudgetLimit(smokeMode) {
  return smokeMode === 'budget' ? 0 : null;
}

export function getSmokeAttemptTimeoutMs(smokeMode, attemptIndex, defaultTimeoutMs) {
  if (smokeMode === 'timeout') {
    return 1;
  }

  if (smokeMode === 'fallback' && attemptIndex === 0) {
    return 1;
  }

  return defaultTimeoutMs;
}
