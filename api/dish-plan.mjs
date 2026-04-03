import {
  callGeminiText,
  extractGeminiText,
  extractGroundingLinks,
  getServerGeminiKey,
  jsonResponse,
  normalizeIngredientEntries,
  normalizeInstructionSteps,
  normalizeRecipeLinks,
  parseJsonBody,
  parseJsonFromGeminiText,
  preflightResponse,
  titleCase,
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
  const dishName = String(body?.dishName || '').trim();
  const servings = Number(body?.servings) || 1;
  const allergies = Array.isArray(body?.allergies) ? body.allergies.map((value) => String(value).trim()).filter(Boolean) : [];

  if (!dishName) {
    return jsonResponse(400, { error: 'dishName is required.' });
  }

  const allergyText = allergies.length ? allergies.join(', ') : 'none';
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              `Dish name: ${dishName}`,
              `Servings: ${servings}`,
              `Allergies to watch: ${allergyText}`,
              'Use Google Search grounding to build a realistic home-cooking recipe.',
              'Return JSON only with this exact shape:',
              '{"title":"dish","serves":2,"ingredients":[{"name":"ingredient","quantity":1,"unit":"unit","category":"vegetable"}],"steps":["step"],"youtubeLinks":["https://..."]}',
              'Rules:',
              '- ingredients must be a realistic shopping list for the requested servings.',
              '- quantity must be numeric.',
              '- unit must be short and practical.',
              '- category must be one of: vegetable, meat, fish, dairy, pantry, egg.',
              '- steps must be specific real cooking steps, not placeholders.',
              '- include 1 or 2 YouTube links when clearly relevant, otherwise return a YouTube search link for the dish.',
              '- keep the ingredient list concise and useful for a home cook.',
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
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 900,
    },
  };

  try {
    const payload = await callGeminiText(apiKey, requestBody);
    const text = extractGeminiText(payload);
    const parsed = parseJsonFromGeminiText(text);
    if (!parsed) {
      return jsonResponse(502, { error: 'Gemini returned an unreadable recipe payload.' });
    }

    const ingredients = normalizeIngredientEntries(parsed.ingredients);
    const steps = normalizeInstructionSteps(parsed.steps);
    if (!ingredients.length || !steps.length) {
      return jsonResponse(502, { error: 'Gemini returned an incomplete recipe.' });
    }

    const title = titleCase(parsed.title || dishName);
    return jsonResponse(200, {
      title,
      serves: Number(parsed.serves) || servings,
      ingredients,
      steps,
      youtubeLinks: normalizeRecipeLinks(parsed.youtubeLinks, title),
      sourceLinks: extractGroundingLinks(payload?.candidates?.[0]?.groundingMetadata || payload?.groundingMetadata),
      allergyWarnings: [],
    });
  } catch (error) {
    return jsonResponse(error?.status || 502, {
      error: error?.message || 'Gemini dish plan request failed.',
    });
  }
}
