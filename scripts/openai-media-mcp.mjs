#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  createSoraVideo,
  downloadSoraVideo,
  generateOpenAIImage,
  getSoraVideoStatus,
  listSoraVideos,
  validateOpenAIMediaSetup,
} from "./lib/openai-media-client.mjs";

const server = new McpServer({
  name: "likhle-openai-media",
  version: "1.0.0",
});

function asToolResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

server.registerTool(
  "openai_media_validate_setup",
  {
    description:
      "Validate the local OpenAI media setup from the Likhle repo. By default it only checks env presence; online checks are optional.",
    inputSchema: {
      onlineCheck: z.boolean().optional().describe("Whether to verify model access online."),
    },
  },
  async ({ onlineCheck }) =>
    asToolResult(await validateOpenAIMediaSetup({ onlineCheck }))
);

server.registerTool(
  "openai_generate_image",
  {
    description:
      "Generate premium campaign art with OpenAI image generation and save it to the local repo.",
    inputSchema: {
      prompt: z.string().describe("Prompt for the image."),
      model: z.string().optional().describe("Image model. Defaults to gpt-image-1."),
      size: z
        .enum(["1024x1024", "1536x1024", "1024x1536", "auto"])
        .optional()
        .describe("Image size."),
      quality: z
        .enum(["low", "medium", "high", "auto"])
        .optional()
        .describe("Generation quality."),
      background: z
        .enum(["transparent", "opaque", "auto"])
        .optional()
        .describe("Image background handling."),
      outputFormat: z
        .enum(["png", "jpeg", "webp"])
        .optional()
        .describe("Saved image format."),
      moderation: z
        .enum(["low", "auto"])
        .optional()
        .describe("Moderation level."),
      outputDir: z.string().optional().describe("Optional output directory."),
      filenameStem: z.string().optional().describe("Optional file name stem."),
    },
  },
  async (input) => asToolResult(await generateOpenAIImage(input))
);

server.registerTool(
  "openai_sora_create_video",
  {
    description:
      "Create a Sora video generation job and return the job metadata.",
    inputSchema: {
      prompt: z.string().describe("Prompt for the video."),
      model: z
        .enum(["sora-2", "sora-2-pro", "sora-2-2025-10-06", "sora-2-pro-2025-10-06", "sora-2-2025-12-08"])
        .optional()
        .describe("Sora model."),
      seconds: z.enum(["4", "8", "12"]).optional().describe("Video duration."),
      size: z
        .enum(["720x1280", "1280x720", "1024x1792", "1792x1024"])
        .optional()
        .describe("Video size."),
    },
  },
  async (input) => asToolResult(await createSoraVideo(input))
);

server.registerTool(
  "openai_sora_get_video_status",
  {
    description: "Fetch the latest metadata for a Sora video job.",
    inputSchema: {
      videoId: z.string().describe("The OpenAI video job ID."),
    },
  },
  async ({ videoId }) => asToolResult(await getSoraVideoStatus({ videoId }))
);

server.registerTool(
  "openai_sora_list_videos",
  {
    description: "List recent Sora video jobs for the current OpenAI project.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).optional().describe("Max number of jobs."),
      order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
    },
  },
  async ({ limit, order }) => asToolResult(await listSoraVideos({ limit, order }))
);

server.registerTool(
  "openai_sora_download_video",
  {
    description:
      "Download a completed Sora video asset to the local repo.",
    inputSchema: {
      videoId: z.string().describe("The OpenAI video job ID."),
      variant: z
        .enum(["video", "thumbnail", "spritesheet"])
        .optional()
        .describe("Which asset variant to download."),
      outputDir: z.string().optional().describe("Optional output directory."),
      filenameStem: z.string().optional().describe("Optional file name stem."),
    },
  },
  async ({ videoId, variant, outputDir, filenameStem }) =>
    asToolResult(
      await downloadSoraVideo({
        videoId,
        variant,
        outputDir,
        filenameStem,
      })
    )
);

async function main() {
  if (process.argv.includes("--check")) {
    const onlineCheck = process.argv.includes("--online");
    const result = await validateOpenAIMediaSetup({ onlineCheck });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Likhle OpenAI media MCP server is running on stdio.");
}

main().catch((error) => {
  console.error("OpenAI media MCP server failed:", error);
  process.exitCode = 1;
});
