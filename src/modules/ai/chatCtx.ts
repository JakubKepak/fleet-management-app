import { createContext } from 'react'
import type { ChatMessage } from '@/types/chat'

export interface ChatContextValue {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
}

export const ChatCtx = createContext<ChatContextValue | null>(null)
