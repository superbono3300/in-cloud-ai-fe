import type { ModelConfig } from '@type'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.0.171:8000/v1'

export const MODELS: ModelConfig[] = [
    {
    name: 'IN Cloud AI 7B',
    model: import.meta.env.VITE_MODEL_7B || 'qwen2.5-coder:7b-instruct',
  apiBase: API_BASE,
    apiKey: import.meta.env.VITE_API_KEY_7B || '',
    headers: {
      'X-MS-Name': '',
      'X-Branch': 'main',
    },
  },
  {
    name: 'IN Cloud AI 32B',
    model: import.meta.env.VITE_MODEL_32B || 'qwen2.5-coder:32b-instruct-q4_K_M',
    apiBase: API_BASE,
    apiKey: import.meta.env.VITE_API_KEY_32B || '',
    headers: {
      'X-MS-Name': '',
      'X-Branch': 'main',
    },
  }
]
