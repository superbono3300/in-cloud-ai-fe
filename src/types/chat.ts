/**
 * 채팅 메시지 역할 타입
 */
export type ChatRole = 'system' | 'user' | 'assistant'

/**
 * 채팅 메시지 타입
 */
export type ChatMessage = {
  role: ChatRole
  content: string
  imageUrls?: string[]
}

/**
 * useChat hook의 반환 타입
 */
export type UseChatReturn = {
  messages: ChatMessage[]
  loading: boolean
  stopped: boolean
  error: string
  sendMessage: (userMessage: string, images?: File[]) => Promise<boolean>
  resumePair: (pairIndex: number) => Promise<boolean>
  stopGeneration: () => void
  clearMessages: () => void
  setMessages: (messages: ChatMessage[]) => void
  deletePair: (pairIndex: number) => void
}
