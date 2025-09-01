import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
    }

    const result = await streamText({
      model: openai(model || 'gpt-4o-mini'),
      prompt,
    });

    // Stream plain text suitable for fetch streaming on the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Recommendation stream error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}



