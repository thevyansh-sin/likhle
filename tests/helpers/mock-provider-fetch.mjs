const GROQ_HOST = 'api.groq.com';
const GEMINI_HOST = 'generativelanguage.googleapis.com';

function ensureState() {
  const state = globalThis.__likhleProviderMockState || {
    groqCalls: 0,
    geminiCalls: 0,
  };

  if (!globalThis.__likhleProviderMockState) {
    globalThis.__likhleProviderMockState = state;
  }

  return state;
}

function buildGeminiTextResponse(text) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    }
  );
}

function buildTransientProviderResponse() {
  return new Response(
    JSON.stringify({
      error: {
        message: 'service unavailable',
      },
    }),
    {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    }
  );
}

async function getRequestBodyText(input, init) {
  if (typeof init?.body === 'string') {
    return init.body;
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    try {
      return await input.clone().text();
    } catch {
      return '';
    }
  }

  return '';
}

if (!globalThis.__likhleOriginalFetch) {
  globalThis.__likhleOriginalFetch = globalThis.fetch.bind(globalThis);
}

globalThis.fetch = async (input, init) => {
  const state = ensureState();
  const url = typeof input === 'string' ? input : input?.url || '';
  const bodyText = await getRequestBodyText(input, init);
  const budgetExhaustionScenario = bodyText.includes('SMOKE_BUDGET_EXHAUSTION');

  if (typeof url === 'string' && url.includes(GROQ_HOST)) {
    state.groqCalls += 1;

    if (budgetExhaustionScenario) {
      if (state.groqCalls % 2 === 1) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"results":[]}',
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          }
        );
      }

      return buildTransientProviderResponse();
    }

    if (state.groqCalls <= 3) {
      return buildTransientProviderResponse();
    }

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                '{"results":[{"text":"Mock caption 1","rewriteSuggestions":[{"label":"Shorter","instruction":"Make it tighter."}]},{"text":"Mock caption 2","rewriteSuggestions":[{"label":"Shift vibe","instruction":"Make it feel more cinematic."}]},{"text":"Mock caption 3","rewriteSuggestions":[{"label":"Fresh angle","instruction":"Give it a fresher angle."}]}]}',
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
  }

  if (typeof url === 'string' && url.includes(GEMINI_HOST)) {
    state.geminiCalls += 1;

    if (state.geminiCalls === 1) {
      return buildGeminiTextResponse('{"scene":"mock image context","vibe":"clean premium"}');
    }

    return buildGeminiTextResponse(
      '{"results":[{"text":"Mock caption 1","rewriteSuggestions":[{"label":"Shorter","instruction":"Make it tighter."}]},{"text":"Mock caption 2","rewriteSuggestions":[{"label":"Shift vibe","instruction":"Make it feel more cinematic."}]},{"text":"Mock caption 3","rewriteSuggestions":[{"label":"Fresh angle","instruction":"Give it a fresher angle."}]}]}'
    );
  }

  return globalThis.__likhleOriginalFetch(input, init);
};
