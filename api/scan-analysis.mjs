import {
  callGeminiImage,
  callGeminiText,
  extractGeminiText,
  extractGroundingLinks,
  getInlineImageFromDataUrl,
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
  const imageDataUrl = String(body?.imageDataUrl || '').trim();
  const sourceName = String(body?.sourceName || '').trim();
  if (!imageDataUrl) {
    return jsonResponse(400, { error: 'imageDataUrl is required.' });
  }

  const inlineData = getInlineImageFromDataUrl(imageDataUrl, String(body?.mimeType || 'image/jpeg'));
  if (!inlineData) {
    return jsonResponse(400, { error: 'Invalid image data.' });
  }

  const visionRequestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Analyze this image of ingredients, groceries, leftovers, or a cooked dish.',
              'Return JSON only with this exact shape:',
              '{"ingredients":["ingredient"],"possibleDishes":["dish name"],"sceneSummary":"short visual summary"}',
              'Rules:',
              '- Detect at most 12 clear ingredients or packaged foods.',
              '- Use short generic English names.',
              '- possibleDishes should contain up to 4 likely dish names if a cooked dish is visible or strongly implied.',
              '- Omit anything uncertain.',
              '- No markdown and no extra explanation.',
            ].join('\n'),
          },
          {
            inlineData,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 600,
    },
  };

  try {
    const visionPayload = await callGeminiImage(apiKey, visionRequestBody);
    const visionText = extractGeminiText(visionPayload);
    const parsedVision = parseJsonFromGeminiText(visionText);
    const ingredients = normalizeDetectedIngredients(parsedVision?.ingredients);
    const possibleDishes = normalizeDetectedIngredients(parsedVision?.possibleDishes || []);
    const sceneSummary = String(parsedVision?.sceneSummary || '').trim();

    if (!ingredients.length && !possibleDishes.length) {
      return jsonResponse(502, { error: 'Gemini could not confidently recognize ingredients from this image.' });
    }

    const groundedRequestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                `Detected ingredients from the scan: ${ingredients.join(', ') || 'none'}`,
                `Possible dish names from vision: ${possibleDishes.join(', ') || 'none'}`,
                `Optional filename/context: ${sourceName || 'none'}`,
                `Visual summary: ${sceneSummary || 'none'}`,
                'Use Google Search grounding to suggest realistic recipes that match this scan.',
                'Return JSON only with this exact shape:',
                '{"recipes":[{"title":"dish","summary":"short summary","description":"why this dish matches the scan","serves":2,"ingredients":[{"name":"ingredient","quantity":1,"unit":"unit","category":"vegetable"}],"steps":["step"],"youtubeLinks":["https://..."],"extras":[{"name":"ingredient","quantity":1,"unit":"unit","category":"pantry"}]}]}',
                'Rules:',
                '- Suggest up to 4 real dishes from common web recipes.',
                '- Prefer dishes that strongly match the detected ingredients or the visible cooked dish.',
                '- ingredients must be the full recipe ingredient list, not only the detected ingredients.',
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
        temperature: 0.22,
        topP: 0.85,
        maxOutputTokens: 1900,
      },
    };

    const groundedPayload = await callGeminiText(apiKey, groundedRequestBody);
    const groundedText = extractGeminiText(groundedPayload);
    const parsedGrounded = parseJsonFromGeminiText(groundedText);
    const suggestions = normalizeRecipeSuggestions(parsedGrounded?.recipes);
    if (!suggestions.length) {
      return jsonResponse(502, { error: 'Gemini returned no usable scan recipe suggestions.' });
    }

    const sourceLinks = extractGroundingLinks(groundedPayload?.candidates?.[0]?.groundingMetadata || groundedPayload?.groundingMetadata);
    return jsonResponse(200, {
      ingredients,
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        sourceLinks,
      })),
      source: 'gemini',
    });
  } catch (error) {
    return jsonResponse(error?.status || 502, {
      error: error?.message || 'Gemini scan analysis failed.',
    });
  }
}
