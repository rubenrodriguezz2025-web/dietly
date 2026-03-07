import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';

export const anthropicClient = new Anthropic({
  apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
});
