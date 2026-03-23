import Groq from 'groq-sdk';

export const RETRY_BACKOFF_BASE_MS = 1250;
const PROVIDER_CONNECTION_RETRY_AFTER_SECONDS = 20;
const PROVIDER_TIMEOUT_RETRY_AFTER_SECONDS = 45;
const PROVIDER_CONNECTION_RETRY_DELAY_MS = 1500;
const PROVIDER_TIMEOUT_RETRY_DELAY_MS = 2200;
const PROVIDER_UNSTABLE_RETRY_DELAY_MS = 1800;

const PROVIDER_TIMEOUT_SIGNAL_PATTERNS = [
  /timed out/i,
  /\btimeout\b/i,
  /headers timeout/i,
  /connect timeout/i,
  /request timeout/i,
  /response timeout/i,
  /und_err_headers_timeout/i,
  /und_err_connect_timeout/i,
];
const PROVIDER_CONNECTION_SIGNAL_PATTERNS = [
  /connection error/i,
  /fetch failed/i,
  /\benotfound\b/i,
  /\beai_again\b/i,
  /dns/i,
  /getaddrinfo/i,
  /\beconnreset\b/i,
  /\beconnrefused\b/i,
  /socket hang up/i,
  /client network socket disconnected/i,
  /unable to connect/i,
  /network error/i,
];
const PROVIDER_UNSTABLE_SIGNAL_PATTERNS = [
  /temporar/i,
  /overloaded/i,
  /\bbusy\b/i,
  /unavailable/i,
  /service unavailable/i,
  /upstream/i,
];

export function getHeaderValue(headers, name) {
  if (!headers) {
    return null;
  }

  if (typeof headers.get === 'function') {
    return headers.get(name);
  }

  const lowerName = name.toLowerCase();
  const headerEntries = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === lowerName
  );

  return headerEntries?.[1] ?? null;
}

export function parseRetryAfterSeconds(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

export function formatRetryDelay(retryAfterSeconds) {
  if (!retryAfterSeconds || retryAfterSeconds < 60) {
    return retryAfterSeconds
      ? `about ${retryAfterSeconds} seconds`
      : 'a moment';
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);

  return minutes === 1 ? 'about 1 minute' : `about ${minutes} minutes`;
}

export function getProviderErrorSignals(error) {
  const status = Number(error?.status);
  const errorName = typeof error?.name === 'string' ? error.name : '';
  const providerMessage =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    '';
  const providerCode = error?.error?.error?.code || error?.error?.code || '';
  const causeCode =
    error?.cause?.code ||
    error?.cause?.cause?.code ||
    error?.error?.code ||
    '';
  const causeMessage =
    error?.cause?.message ||
    error?.cause?.cause?.message ||
    '';
  const signalText =
    `${providerMessage} ${causeMessage} ${providerCode} ${causeCode} ${errorName}`.toLowerCase();
  const retryAfterSeconds = parseRetryAfterSeconds(
    getHeaderValue(error?.headers, 'retry-after')
  );

  return {
    status,
    providerMessage,
    providerCode,
    causeCode,
    signalText,
    retryAfterSeconds,
  };
}

export function hasProviderSignal(signalText, patterns) {
  return patterns.some((pattern) => pattern.test(signalText));
}

export function normalizeProviderError(error) {
  const { status, providerMessage, providerCode, signalText, retryAfterSeconds } =
    getProviderErrorSignals(error);

  if (
    status === 429 ||
    providerCode === 'rate_limit_exceeded' ||
    /rate limit/i.test(providerMessage)
  ) {
    const retryMessage = retryAfterSeconds
      ? `Try again in ${formatRetryDelay(retryAfterSeconds)}.`
      : 'Try again in 30-60 seconds.';

    return {
      kind: 'quota',
      status: 429,
      retryAfterSeconds,
      retryDelayMs: Math.min(
        Math.max(RETRY_BACKOFF_BASE_MS, (retryAfterSeconds || 2) * 1000),
        6000
      ),
      message: `Likhle is hitting the current AI quota right now. ${retryMessage}`,
    };
  }

  if (
    (typeof Groq.APIConnectionTimeoutError === 'function' &&
      error instanceof Groq.APIConnectionTimeoutError) ||
    hasProviderSignal(signalText, PROVIDER_TIMEOUT_SIGNAL_PATTERNS)
  ) {
    return {
      kind: 'timeout',
      status: 504,
      retryAfterSeconds: PROVIDER_TIMEOUT_RETRY_AFTER_SECONDS,
      retryDelayMs: PROVIDER_TIMEOUT_RETRY_DELAY_MS,
      message: `The AI provider took too long to respond that time. Likhle will stop waiting and let you retry instead. Try again in ${formatRetryDelay(PROVIDER_TIMEOUT_RETRY_AFTER_SECONDS)}.`,
    };
  }

  if (
    (typeof Groq.APIConnectionError === 'function' &&
      error instanceof Groq.APIConnectionError) ||
    hasProviderSignal(signalText, PROVIDER_CONNECTION_SIGNAL_PATTERNS)
  ) {
    return {
      kind: 'connection',
      status: 503,
      retryAfterSeconds: PROVIDER_CONNECTION_RETRY_AFTER_SECONDS,
      retryDelayMs: PROVIDER_CONNECTION_RETRY_DELAY_MS,
      message: `Likhle could not reach the AI provider right now. This looks like a temporary network issue. Try again in ${formatRetryDelay(PROVIDER_CONNECTION_RETRY_AFTER_SECONDS)}.`,
    };
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /temporar/i.test(providerMessage) ||
    hasProviderSignal(signalText, PROVIDER_UNSTABLE_SIGNAL_PATTERNS)
  ) {
    return {
      kind: 'unstable',
      status: 503,
      retryAfterSeconds: PROVIDER_CONNECTION_RETRY_AFTER_SECONDS,
      retryDelayMs: PROVIDER_UNSTABLE_RETRY_DELAY_MS,
      message: `The AI provider is unstable right now. Try again in ${formatRetryDelay(PROVIDER_CONNECTION_RETRY_AFTER_SECONDS)}.`,
    };
  }

  return null;
}

export function isTransientProviderError(error) {
  const providerError = normalizeProviderError(error);

  if (providerError) {
    return providerError.kind !== 'quota';
  }

  const { status, providerMessage, signalText } = getProviderErrorSignals(error);

  return Boolean(
    status === 502 ||
      status === 503 ||
      status === 504 ||
      /temporar/i.test(providerMessage) ||
      /timeout/i.test(providerMessage) ||
      hasProviderSignal(signalText, PROVIDER_CONNECTION_SIGNAL_PATTERNS) ||
      hasProviderSignal(signalText, PROVIDER_UNSTABLE_SIGNAL_PATTERNS) ||
      hasProviderSignal(signalText, PROVIDER_TIMEOUT_SIGNAL_PATTERNS)
  );
}

export function getRetryDelayMs(error, attemptIndex) {
  const providerError = normalizeProviderError(error);

  if (providerError?.retryDelayMs) {
    return providerError.retryDelayMs;
  }

  return RETRY_BACKOFF_BASE_MS * (attemptIndex + 1);
}
