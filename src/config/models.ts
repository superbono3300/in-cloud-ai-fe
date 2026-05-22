import type { ModelConfig } from '@type'

export const MODELS: ModelConfig[] = [
    {
    name: 'IN Cloud AI 7B',
    model: import.meta.env.VITE_MODEL_7B || 'qwen2.5-coder:7b-instruct',
    apiBase: '/api/v1',
    apiKey: import.meta.env.VITE_API_KEY_7B || '',
    headers: {
      'X-MS-Name': '',
      'X-Branch': 'main',
    },
  },
  {
    name: 'IN Cloud AI 32B',
    model: import.meta.env.VITE_MODEL_32B || 'qwen2.5-coder:32b-instruct-q4_K_M',
    apiBase: '/api/v1',
    apiKey: import.meta.env.VITE_API_KEY_32B || '',
    headers: {
      'X-MS-Name': '',
      'X-Branch': 'main',
    },
  }
]
