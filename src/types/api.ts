import type { ChatMessage } from './chat'

/**
 * 챗 API 모델 설정 타입
 */
export type ChatApiModel = {
  apiBase: string
  apiKey: string
  model: string
  name?: string
  headers?: Record<string, string>
}

/**
 * 모델 설정 타입
 */
export type ModelConfig = {
  name: string
  model: string
  apiBase: string
  apiKey: string
  headers: Record<string, string>
}

/**
 * useChat hook 옵션 타입
 */
export interface UseChatOptions {
  systemPrompt?: string
  initialMessages?: ChatMessage[]
}

/**
 * API 응답 타입
 */
export type ChatApiResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}
