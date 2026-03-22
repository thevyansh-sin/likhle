export function parseMultipartFormData(bodyBuffer, contentType = '') {
  if (!bodyBuffer || bodyBuffer.length === 0) {
    return {};
  }

  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);

  if (!boundaryMatch) {
    return {};
  }

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const bodyText = bodyBuffer.toString('utf8');
  const parts = bodyText.split(boundary).slice(1, -1);
  const parsed = {};

  for (const part of parts) {
    const normalizedPart = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separatorIndex = normalizedPart.indexOf('\r\n\r\n');

    if (separatorIndex === -1) {
      continue;
    }

    const rawHeaders = normalizedPart.slice(0, separatorIndex);
    const rawValue = normalizedPart.slice(separatorIndex + 4).replace(/\r\n$/, '');
    const nameMatch = /name="([^"]+)"/i.exec(rawHeaders);

    if (!nameMatch) {
      continue;
    }

    parsed[nameMatch[1]] = rawValue;
  }

  return parsed;
}
