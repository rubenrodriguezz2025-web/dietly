import { NextResponse } from 'next/server';

import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const anthropicKeyExists = anthropicKey.length > 0;
  const anthropicKeyPrefix = anthropicKeyExists ? anthropicKey.slice(0, 14) + '...' : null;
  const supabaseUrlExists = supabaseUrl.length > 0;
  const model = 'claude-sonnet-4-5-20250929';

  let anthropicTest: { ok: boolean; error?: string; response?: string } = { ok: false };

  if (anthropicKeyExists) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const message = await client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'di hola' }],
      });
      const text =
        message.content[0].type === 'text' ? message.content[0].text : '(non-text response)';
      anthropicTest = { ok: true, response: text };
    } catch (err) {
      anthropicTest = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    anthropicTest = { ok: false, error: 'ANTHROPIC_API_KEY no configurada' };
  }

  return NextResponse.json({
    anthropic_key_exists: anthropicKeyExists,
    anthropic_key_prefix: anthropicKeyPrefix,
    supabase_url_exists: supabaseUrlExists,
    model,
    anthropic_test: anthropicTest,
  });
}
