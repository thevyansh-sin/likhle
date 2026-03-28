const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SESSION_KEY_PATTERN = /^[A-Za-z0-9:-]{8,80}$/;

export function normalizePlainText(value, { maxLength = 280, trim = true, preserveNewlines = true } = {}) {
  if (typeof value !== 'string') {
    return '';
  }

  let nextValue = value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARACTER_PATTERN, '');

  if (!preserveNewlines) {
    nextValue = nextValue.replace(/\n+/g, ' ');
  }

  if (Number.isFinite(maxLength) && maxLength > 0) {
    nextValue = nextValue.slice(0, maxLength);
  }

  return trim ? nextValue.trim() : nextValue;
}

export function normalizeSingleLineText(value, { maxLength = 280, trim = true } = {}) {
  return normalizePlainText(value, {
    maxLength,
    trim,
    preserveNewlines: false,
  });
}

export function normalizeStringArray(value, { maxItems = 3, maxLength = 280 } = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => normalizePlainText(item, { maxLength }))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeSessionKey(value, { maxLength = 80 } = {}) {
  const nextValue = normalizeSingleLineText(value, { maxLength });
  return SESSION_KEY_PATTERN.test(nextValue) ? nextValue : '';
}

export function serializeJsonForHtmlScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
