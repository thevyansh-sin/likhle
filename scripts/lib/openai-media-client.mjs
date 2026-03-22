import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import OpenAI from "openai";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env.local") });

function requiredEnv(name) {
  const raw = process.env[name];
  const trimmed = raw ? String(raw).trim() : "";

  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trimmed;
}

function inspectEnv(name) {
  const raw = process.env[name];
  const trimmed = raw ? String(raw).trim() : "";

  return {
    present: Boolean(raw),
    hadOuterWhitespace: Boolean(raw) && raw !== trimmed,
  };
}

function ensureAbsoluteOutputDir(dirPath) {
  if (path.isAbsolute(dirPath)) {
    return dirPath;
  }

  return path.join(repoRoot, dirPath);
}

function slugify(value, fallback = "asset") {
  const safe = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return safe || fallback;
}

function timestampStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: requiredEnv("OPENAI_API_KEY"),
  });
}

export function getOpenAIEnvironmentStatus() {
  const apiKey = inspectEnv("OPENAI_API_KEY");

  return {
    repoRoot,
    hasOpenAIApiKey: apiKey.present,
    openAIApiKeyHadOuterWhitespace: apiKey.hadOuterWhitespace,
  };
}

export async function validateOpenAIMediaSetup({ onlineCheck = false } = {}) {
  const envStatus = getOpenAIEnvironmentStatus();

  if (!envStatus.hasOpenAIApiKey) {
    return {
      ok: false,
      envStatus,
      validationError: {
        message: "Missing OPENAI_API_KEY in .env.local.",
        status: null,
        details: null,
      },
    };
  }

  if (!onlineCheck) {
    return {
      ok: true,
      envStatus,
      note: "Environment looks ready. Online model checks were skipped.",
    };
  }

  try {
    const client = getOpenAIClient();
    const [imageModel, videoModel] = await Promise.allSettled([
      client.models.retrieve("gpt-image-1"),
      client.models.retrieve("sora-2"),
    ]);

    return {
      ok: true,
      envStatus,
      onlineCheck: {
        imageModel:
          imageModel.status === "fulfilled"
            ? { ok: true, id: imageModel.value.id }
            : { ok: false, message: imageModel.reason?.message || "Unknown error" },
        videoModel:
          videoModel.status === "fulfilled"
            ? { ok: true, id: videoModel.value.id }
            : { ok: false, message: videoModel.reason?.message || "Unknown error" },
      },
    };
  } catch (error) {
    return {
      ok: false,
      envStatus,
      validationError: {
        message: error.message,
        status: error.status || null,
        details: error.error || null,
      },
    };
  }
}

export async function generateOpenAIImage({
  prompt,
  model = "gpt-image-1",
  size = "1024x1536",
  quality = "medium",
  background = "opaque",
  outputFormat = "png",
  moderation = "auto",
  outputDir = "social-assets/openai-media/images",
  filenameStem,
}) {
  if (!prompt) {
    throw new Error("prompt is required.");
  }

  const client = getOpenAIClient();
  const response = await client.images.generate({
    model,
    prompt,
    size,
    quality,
    background,
    output_format: outputFormat,
    moderation,
  });

  const image = response.data?.[0];

  if (!image?.b64_json) {
    throw new Error("OpenAI image response did not include image bytes.");
  }

  const absoluteOutputDir = ensureAbsoluteOutputDir(outputDir);
  await ensureDir(absoluteOutputDir);

  const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;
  const fileName = `${filenameStem ? slugify(filenameStem) : slugify(prompt)}-${timestampStamp()}.${ext}`;
  const outputPath = path.join(absoluteOutputDir, fileName);

  await fs.writeFile(outputPath, Buffer.from(image.b64_json, "base64"));

  return {
    ok: true,
    model,
    prompt,
    outputPath,
    revisedPrompt: image.revised_prompt || null,
    usage: response.usage || null,
    size: response.size || size,
    quality: response.quality || quality,
    outputFormat: response.output_format || outputFormat,
  };
}

export async function createSoraVideo({
  prompt,
  model = "sora-2",
  seconds = "8",
  size = "720x1280",
}) {
  if (!prompt) {
    throw new Error("prompt is required.");
  }

  const client = getOpenAIClient();
  const video = await client.videos.create({
    prompt,
    model,
    seconds,
    size,
  });

  return {
    ok: true,
    video,
  };
}

export async function getSoraVideoStatus({ videoId }) {
  if (!videoId) {
    throw new Error("videoId is required.");
  }

  const client = getOpenAIClient();
  const video = await client.videos.retrieve(videoId);

  return {
    ok: true,
    video,
  };
}

export async function listSoraVideos({ limit = 10, order = "desc" } = {}) {
  const client = getOpenAIClient();
  const response = await client.videos.list({
    limit,
    order,
  });

  return {
    ok: true,
    items: response.data || [],
    hasNextPage: response.hasNextPage?.() || false,
  };
}

export async function downloadSoraVideo({
  videoId,
  variant = "video",
  outputDir = "social-assets/openai-media/videos",
  filenameStem,
}) {
  if (!videoId) {
    throw new Error("videoId is required.");
  }

  const client = getOpenAIClient();
  const response = await client.videos.downloadContent(videoId, { variant });
  const buffer = Buffer.from(await response.arrayBuffer());

  const absoluteOutputDir = ensureAbsoluteOutputDir(outputDir);
  await ensureDir(absoluteOutputDir);

  const ext = variant === "video" ? "mp4" : "jpg";
  const fileName = `${filenameStem ? slugify(filenameStem) : `sora-${videoId}`}-${variant}.${ext}`;
  const outputPath = path.join(absoluteOutputDir, fileName);

  await fs.writeFile(outputPath, buffer);

  return {
    ok: true,
    videoId,
    variant,
    outputPath,
  };
}
