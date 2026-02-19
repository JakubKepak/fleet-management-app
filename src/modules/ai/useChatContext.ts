import { useContext } from 'react'
import { ChatCtx } from './chatCtx'

export function useChatContext() {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}
