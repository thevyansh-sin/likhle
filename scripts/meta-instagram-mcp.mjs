#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  createAndPublishImage,
  createImageContainer,
  getContainerStatus,
  getInstagramEnvironmentStatus,
  publishMedia,
  validateInstagramSetup,
} from "./lib/instagram-graph-client.mjs";

const server = new McpServer({
  name: "likhle-meta-instagram",
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
  "instagram_validate_setup",
  {
    description:
      "Validate the current Instagram Graph API setup using env values from the Likhle repo.",
    inputSchema: {},
  },
  async () => {
    const envStatus = getInstagramEnvironmentStatus();
    try {
      const validation = await validateInstagramSetup();

      return asToolResult({
        ok: true,
        envStatus,
        validation,
      });
    } catch (error) {
      return asToolResult({
        ok: false,
        envStatus,
        validationError: {
          message: error.message,
          status: error.status || null,
          details: error.details || null,
        },
      });
    }
  }
);

server.registerTool(
  "instagram_create_image_container",
  {
    description:
      "Create an unpublished Instagram image media container from a public https image URL and caption.",
    inputSchema: {
      imageUrl: z.string().describe("Public https URL for the image."),
      caption: z.string().optional().describe("Instagram caption text."),
    },
  },
  async ({ imageUrl, caption }) =>
    asToolResult(await createImageContainer({ imageUrl, caption }))
);

server.registerTool(
  "instagram_get_container_status",
  {
    description: "Fetch the readiness status for an Instagram media container.",
    inputSchema: {
      creationId: z.string().describe("The media container ID returned by Meta."),
    },
  },
  async ({ creationId }) =>
    asToolResult(await getContainerStatus({ creationId }))
);

server.registerTool(
  "instagram_publish_media",
  {
    description: "Publish a previously created Instagram media container.",
    inputSchema: {
      creationId: z.string().describe("The media container ID returned by Meta."),
    },
  },
  async ({ creationId }) => asToolResult(await publishMedia({ creationId }))
);

server.registerTool(
  "instagram_create_and_publish_image",
  {
    description:
      "Create an Instagram image container, wait until it is ready, then publish it.",
    inputSchema: {
      imageUrl: z.string().describe("Public https URL for the image."),
      caption: z.string().optional().describe("Instagram caption text."),
      maxAttempts: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("How many readiness checks to run before failing."),
      intervalMs: z
        .number()
        .int()
        .min(1000)
        .max(10000)
        .optional()
        .describe("Delay between readiness checks in milliseconds."),
    },
  },
  async ({ imageUrl, caption, maxAttempts, intervalMs }) =>
    asToolResult(
      await createAndPublishImage({
        imageUrl,
        caption,
        maxAttempts,
        intervalMs,
      })
    )
);

async function main() {
  if (process.argv.includes("--check")) {
    const envStatus = getInstagramEnvironmentStatus();
    try {
      const validation = await validateInstagramSetup();

      console.log(
        JSON.stringify(
          {
            ok: true,
            envStatus,
            validation,
          },
          null,
          2
        )
      );
    } catch (error) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            envStatus,
            validationError: {
              message: error.message,
              status: error.status || null,
              details: error.details || null,
            },
          },
          null,
          2
        )
      );
    }
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Likhle Meta Instagram MCP server is running on stdio.");
}

main().catch((error) => {
  console.error("Meta Instagram MCP server failed:", error);
  process.exitCode = 1;
});
