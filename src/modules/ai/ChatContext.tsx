import { useState, useCallback, useRef } from 'react'
import { useIntl } from 'react-intl'
import { useLocale } from '@/i18n/LocaleContext'
import { useFleetContext } from '@/api/useFleetContext'
import type { ChatMessage, ChatBlock } from '@/types/chat'
import { ChatCtx } from './chatCtx'

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { locale } = useLocale()
  const intl = useIntl()
  const getFleetContext = useFleetContext()
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const history = [...messages, userMsg]
        .filter((m): m is ChatMessage & { content: string } => typeof m.content === 'string' || m.role === 'user')
        .map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        }))

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, fleetContext: getFleetContext(), locale }),
        signal: abortRef.current.signal,
      })

      if (!resp.ok) {
        const errorKey = resp.status === 429 ? 'ai.rateLimited' : 'ai.error'
        const errorBlock: ChatBlock[] = [{ type: 'text', content: intl.formatMessage({ id: errorKey }) }]
        setMessages(prev => [...prev, { role: 'assistant', content: errorBlock, timestamp: new Date().toISOString() }])
        return
      }

      const data = await resp.json()
      let blocks: ChatBlock[]

      if (data.blocks && Array.isArray(data.blocks)) {
        blocks = data.blocks
      } else {
        blocks = [{ type: 'text', content: intl.formatMessage({ id: 'ai.error' }) }]
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: blocks,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return

      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: [{ type: 'text', content: intl.formatMessage({ id: 'ai.error' }) }],
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [messages, getFleetContext, locale, intl])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setIsLoading(false)
  }, [])

  return (
    <ChatCtx value={{ messages, isLoading, sendMessage, clearChat }}>
      {children}
    </ChatCtx>
  )
}
