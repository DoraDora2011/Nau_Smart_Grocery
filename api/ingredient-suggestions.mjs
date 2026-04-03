import {
  callGeminiText,
  extractGeminiText,
  extractGroundingLinks,
  getServerGeminiKey,
  jsonResponse,
  normalizeDetectedIngredients,
  normalizeRecipeSuggestions,
  parseJsonBody,
  parseJsonFromGeminiText,
  preflightResponse,
} from './_lib/gemini.mjs';

export function OPTIONS() {
  return preflightResponse();
}

export async function POST(request) {
  const apiKey = getServerGeminiKey();
  if (!apiKey) {
    return jsonResponse(503, { error: 'Server is missing GEMINI_API_KEY. Add it in Vercel Project Settings > Environment Variables, then redeploy.' });
  }

  const body = await parseJsonBody(request);
  const ingredientsText = String(body?.ingredientsText || '').trim();
  if (!ingredientsText) {
    return jsonResponse(400, { error: 'ingredientsText is required.' });
  }

  const availableIngredients = normalizeDetectedIngredients(ingredientsText);
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              `Available ingredients: ${ingredientsText}`,
              `Normalized ingredient list: ${availableIngredients.join(', ') || 'none'}`,
              'Use Google Search grounding to suggest realistic dishes that can be cooked from these ingredients.',
              'Return JSON only with this exact shape:',
              '{"recipes":[{"title":"dish","summary":"short summary","description":"why it fits these ingredients","serves":2,"ingredients":[{"name":"ingredient","quantity":1,"unit":"unit","category":"vegetable"}],"steps":["step"],"youtubeLinks":["https://..."],"extras":[{"name":"ingredient","quantity":1,"unit":"unit","category":"pantry"}]}]}',
              'Rules:',
              '- Suggest up to 4 real dishes from common recipes on the web.',
              '- Prioritize dishes that use as many of the available ingredients as practical.',
              '- ingredients must be the full recipe ingredient list, not only the ingredients already available.',
              '- extras must contain only 0 to 3 optional missing ingredients that would noticeably improve the dish.',
              '- quantity must be numeric.',
              '- unit must be short and practical.',
              '- category must be one of: vegetable, meat, fish, dairy, pantry, egg.',
              '- steps must be concrete real cooking steps, not placeholders.',
              '- include 1 or 2 YouTube links when clearly relevant, otherwise return a YouTube search link for the dish.',
              '- no markdown, no code fences, no extra commentary.',
            ].join('\n'),
          },
        ],
      },
    ],
    tools: [
      {
        google_search: {},
      },
    ],
    generationConfig: {
      temperature: 0.25,
      topP: 0.85,
      maxOutputTokens: 1800,
    },
  };

  try {
    const payload = await callGeminiText(apiKey, requestBody);
    const text = extractGeminiText(payload);
    const parsed = parseJsonFromGeminiText(text);
    const suggestions = normalizeRecipeSuggestions(parsed?.recipes);
    if (!suggestions.length) {
      return jsonResponse(502, { error: 'Gemini returned no usable recipe suggestions.' });
    }

    const sourceLinks = extractGroundingLinks(payload?.candidates?.[0]?.groundingMetadata || payload?.groundingMetadata);
    return jsonResponse(200, {
      availableIngredients,
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        sourceLinks,
      })),
    });
  } catch (error) {
    return jsonResponse(error?.status || 502, {
      error: error?.message || 'Gemini ingredient suggestion request failed.',
    });
  }
}
