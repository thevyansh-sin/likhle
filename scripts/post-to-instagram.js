function readArg(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function printUsage() {
  console.log(`
Usage:
  node scripts/post-to-instagram.js --validate

  node scripts/post-to-instagram.js \\
    --image-url "https://example.com/image.png" \\
    --caption "Your caption here"
`);
}

async function main() {
  const {
    createAndPublishImage,
    getInstagramEnvironmentStatus,
    validateInstagramSetup,
  } = await import("./lib/instagram-graph-client.mjs");

  if (process.argv.includes("--validate")) {
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

  const imageUrl = readArg("--image-url");
  const caption = readArg("--caption") || "";

  if (!imageUrl) {
    printUsage();
    process.exit(1);
  }

  const result = await createAndPublishImage({
    imageUrl,
    caption,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Instagram posting failed:", error.message);

  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }

  process.exitCode = 1;
});
