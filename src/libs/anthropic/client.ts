import Anthropic from '@anthropic-ai/sdk';

import { getEnvVar } from '@/utils/get-env-var';

export const anthropicClient = new Anthropic({
  apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
});
