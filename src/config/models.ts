import type { ModelConfig } from '@type'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.0.171:8000/v1'
export const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_KEY_7B || ''

/**
 * @deprecated 모델 목록은 useModels 훅을 통해 API에서 동적으로 불러옵니다.
 */
export const MODELS: ModelConfig[] = []

