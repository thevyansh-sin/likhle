import { parseMultipartFormData } from './multipart-form-data.mjs';

const defaultSuggestions = [
  { label: 'Shorter', instruction: 'Make it shorter and tighter.' },
  { label: 'Shift vibe', instruction: 'Make it feel more cinematic and polished.' },
  { label: 'Fresh angle', instruction: 'Give it a fresher and less generic angle.' },
];

function buildGeneratedResult(index, batch) {
  return {
    text: `Mock caption ${index + 1} [batch ${batch}]`,
    rewriteSuggestions: defaultSuggestions,
  };
}

export async function installGenerateApiMock(page) {
  let generationBatch = 0;
  let regenerateBatch = 0;
  let rewriteBatch = 0;

  await page.route('**/api/generate', async (route) => {
    const request = route.request();
    const contentType = request.headerValue('content-type') || '';
    const fields = parseMultipartFormData(request.postDataBuffer(), contentType);
    const rawBody = request.postData() || '';
    const count = Math.max(1, Number.parseInt(fields.count || '3', 10) || 3);
    const hasRewriteAction = Boolean(fields.rewriteAction) || rawBody.includes('name="rewriteAction"');
    const hasAvoidResults = Boolean(fields.avoidResults) || rawBody.includes('name="avoidResults"');

    if (hasRewriteAction) {
      rewriteBatch += 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: `mock-rewrite-${rewriteBatch}`,
          results: [
            {
              text: `Rewritten result ${rewriteBatch}`,
              rewriteSuggestions: defaultSuggestions,
            },
          ],
        }),
      });
      return;
    }

    if (hasAvoidResults) {
      regenerateBatch += 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: `mock-regenerate-${regenerateBatch}`,
          results: [
            {
              text: `Regenerated pick ${regenerateBatch}`,
              rewriteSuggestions: defaultSuggestions,
            },
          ],
        }),
      });
      return;
    }

    generationBatch += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: `mock-generate-${generationBatch}`,
        results: Array.from({ length: count }, (_, index) =>
          buildGeneratedResult(index, generationBatch)
        ),
      }),
    });
  });
}
