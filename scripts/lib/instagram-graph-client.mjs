import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value).trim();
}

function inspectEnv(name) {
  const raw = process.env[name];
  const trimmed = raw ? String(raw).trim() : "";

  return {
    present: Boolean(raw),
    trimmed,
    hadOuterWhitespace: Boolean(raw) && raw !== trimmed,
  };
}

function validateHttpsUrl(value, fieldName = "imageUrl") {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use https.`);
  }

  return parsed.toString();
}

function normalizeGraphError(responseStatus, payload) {
  const message =
    payload?.error?.message ||
    payload?.message ||
    `Meta Graph API request failed with status ${responseStatus}.`;

  const error = new Error(message);
  error.status = responseStatus;
  error.details = payload;
  return error;
}

async function graphRequest(endpoint, { method = "GET", body } = {}) {
  const accessToken = requiredEnv("INSTAGRAM_ACCESS_TOKEN");
  const url = new URL(`${META_GRAPH_BASE_URL}/${endpoint.replace(/^\/+/, "")}`);
  const requestInit = { method, headers: {} };

  if (method === "GET") {
    url.searchParams.set("access_token", accessToken);
  } else {
    requestInit.body = new URLSearchParams({
      ...body,
      access_token: accessToken,
    });
  }

  const response = await fetch(url, requestInit);
  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { rawText };
    }
  }

  if (!response.ok || payload?.error) {
    throw normalizeGraphError(response.status, payload);
  }

  return payload;
}

export function getInstagramEnvironmentStatus() {
  const accessToken = inspectEnv("INSTAGRAM_ACCESS_TOKEN");
  const instagramUserId = inspectEnv("INSTAGRAM_USER_ID");
  const metaAppId = inspectEnv("META_APP_ID");
  const metaAppSecret = inspectEnv("META_APP_SECRET");

  return {
    repoRoot,
    metaGraphVersion: META_GRAPH_VERSION,
    hasAccessToken: accessToken.present,
    hasInstagramUserId: instagramUserId.present,
    hasMetaAppId: metaAppId.present,
    hasMetaAppSecret: metaAppSecret.present,
    accessTokenHadOuterWhitespace: accessToken.hadOuterWhitespace,
    instagramUserIdHadOuterWhitespace: instagramUserId.hadOuterWhitespace,
  };
}

export function getInstagramConfig() {
  return {
    accessToken: requiredEnv("INSTAGRAM_ACCESS_TOKEN"),
    instagramUserId: requiredEnv("INSTAGRAM_USER_ID"),
    metaAppId: process.env.META_APP_ID || null,
    metaAppSecret: process.env.META_APP_SECRET || null,
    metaGraphVersion: META_GRAPH_VERSION,
    repoRoot,
  };
}

export async function validateInstagramSetup() {
  const { instagramUserId, metaGraphVersion } = getInstagramConfig();
  const account = await graphRequest(
    `${instagramUserId}?fields=id,username,account_type,media_count`
  );

  return {
    ok: true,
    metaGraphVersion,
    account,
  };
}

export async function createImageContainer({ imageUrl, caption = "" }) {
  const { instagramUserId } = getInstagramConfig();
  const safeImageUrl = validateHttpsUrl(imageUrl);
  const payload = await graphRequest(`${instagramUserId}/media`, {
    method: "POST",
    body: {
      image_url: safeImageUrl,
      caption,
    },
  });

  return {
    creationId: payload.id,
    imageUrl: safeImageUrl,
  };
}

export async function getContainerStatus({ creationId }) {
  if (!creationId) {
    throw new Error("creationId is required.");
  }

  const payload = await graphRequest(
    `${creationId}?fields=id,status_code,status,error_message`
  );

  return {
    creationId: payload.id || creationId,
    statusCode: payload.status_code || null,
    status: payload.status || null,
    errorMessage: payload.error_message || null,
    raw: payload,
  };
}

export async function publishMedia({ creationId }) {
  if (!creationId) {
    throw new Error("creationId is required.");
  }

  const { instagramUserId } = getInstagramConfig();
  const payload = await graphRequest(`${instagramUserId}/media_publish`, {
    method: "POST",
    body: {
      creation_id: creationId,
    },
  });

  return {
    publishedMediaId: payload.id,
    creationId,
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForContainerReady({
  creationId,
  maxAttempts = 10,
  intervalMs = 3000,
}) {
  let lastStatus = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastStatus = await getContainerStatus({ creationId });

    if (["FINISHED", "PUBLISHED"].includes(lastStatus.statusCode)) {
      return {
        ready: true,
        attempts: attempt,
        status: lastStatus,
      };
    }

    if (["ERROR", "EXPIRED"].includes(lastStatus.statusCode)) {
      return {
        ready: false,
        attempts: attempt,
        status: lastStatus,
      };
    }

    if (attempt < maxAttempts) {
      await wait(intervalMs);
    }
  }

  return {
    ready: false,
    attempts: maxAttempts,
    status: lastStatus,
  };
}

export async function createAndPublishImage({
  imageUrl,
  caption = "",
  maxAttempts = 10,
  intervalMs = 3000,
}) {
  const container = await createImageContainer({ imageUrl, caption });
  const readiness = await waitForContainerReady({
    creationId: container.creationId,
    maxAttempts,
    intervalMs,
  });

  if (!readiness.ready) {
    throw new Error(
      `Media container was not ready to publish. Last status: ${readiness.status?.statusCode || "unknown"}.`
    );
  }

  const publishResult = await publishMedia({
    creationId: container.creationId,
  });

  return {
    ...publishResult,
    readiness,
    imageUrl: container.imageUrl,
  };
}
