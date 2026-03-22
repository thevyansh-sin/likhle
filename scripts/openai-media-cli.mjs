#!/usr/bin/env node

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printUsage() {
  console.log(`
Usage:
  node scripts/openai-media-cli.mjs --validate [--online]
  node scripts/openai-media-cli.mjs --image --prompt "Premium launch art"
  node scripts/openai-media-cli.mjs --video-create --prompt "A cinematic launch film"
  node scripts/openai-media-cli.mjs --video-status --video-id "vid_123"
  node scripts/openai-media-cli.mjs --video-download --video-id "vid_123" [--variant video]
`);
}

async function main() {
  const media = await import("./lib/openai-media-client.mjs");

  if (hasFlag("--validate")) {
    const result = await media.validateOpenAIMediaSetup({
      onlineCheck: hasFlag("--online"),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (hasFlag("--image")) {
    const prompt = readArg("--prompt");
    if (!prompt) {
      throw new Error("--prompt is required for --image");
    }

    const result = await media.generateOpenAIImage({
      prompt,
      model: readArg("--model") || undefined,
      size: readArg("--size") || undefined,
      quality: readArg("--quality") || undefined,
      background: readArg("--background") || undefined,
      outputFormat: readArg("--output-format") || undefined,
      outputDir: readArg("--output-dir") || undefined,
      filenameStem: readArg("--filename") || undefined,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (hasFlag("--video-create")) {
    const prompt = readArg("--prompt");
    if (!prompt) {
      throw new Error("--prompt is required for --video-create");
    }

    const result = await media.createSoraVideo({
      prompt,
      model: readArg("--model") || undefined,
      seconds: readArg("--seconds") || undefined,
      size: readArg("--size") || undefined,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (hasFlag("--video-status")) {
    const videoId = readArg("--video-id");
    if (!videoId) {
      throw new Error("--video-id is required for --video-status");
    }

    const result = await media.getSoraVideoStatus({ videoId });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (hasFlag("--video-download")) {
    const videoId = readArg("--video-id");
    if (!videoId) {
      throw new Error("--video-id is required for --video-download");
    }

    const result = await media.downloadSoraVideo({
      videoId,
      variant: readArg("--variant") || undefined,
      outputDir: readArg("--output-dir") || undefined,
      filenameStem: readArg("--filename") || undefined,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printUsage();
}

main().catch((error) => {
  console.error("OpenAI media CLI failed:", error.message);
  process.exitCode = 1;
});
