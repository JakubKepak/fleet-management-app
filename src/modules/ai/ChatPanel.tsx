import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Input } from 'antd'
import { SendOutlined, DeleteOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import { useChatContext } from './useChatContext'
import { ChatBlockRenderer } from './ChatBlocks'
import type { ChatMessage, ChatBlock } from '@/types/chat'

const SUGGESTED_PROMPTS_KEYS = [
  'ai.suggestStatus',
  'ai.suggestMileage',
  'ai.suggestFuel',
] as const

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
            {message.content as string}
          </div>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 shrink-0 mt-0.5">
            <UserOutlined className="text-xs" />
          </div>
        </div>
      </div>
    )
  }

  const blocks = message.content as ChatBlock[]

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[85%]">
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <RobotOutlined className="text-xs text-white" />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          {blocks.map((block, i) => (
            <ChatBlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <RobotOutlined className="text-xs text-white" />
        </div>
        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChatPanelProps {
  compact?: boolean
}

export default function ChatPanel({ compact }: ChatPanelProps) {
  const intl = useIntl()
  const { messages, isLoading, sendMessage, clearChat } = useChatContext()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage(text)
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleSuggest = useCallback((key: string) => {
    const text = intl.formatMessage({ id: key })
    sendMessage(text)
  }, [intl, sendMessage])

  const isEmpty = messages.length === 0

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100vh-140px)]'}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            >
              <RobotOutlined className="text-2xl text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 m-0 mb-1">
              {intl.formatMessage({ id: 'ai.welcomeTitle' })}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {intl.formatMessage({ id: 'ai.welcomeSubtitle' })}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PROMPTS_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => handleSuggest(key)}
                  className="px-3 py-1.5 text-xs rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  {intl.formatMessage({ id: key })}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isLoading && <LoadingDots />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          {messages.length > 0 && (
            <Button
              icon={<DeleteOutlined />}
              onClick={clearChat}
              size="small"
              className="shrink-0 self-end"
              title={intl.formatMessage({ id: 'ai.clear' })}
            />
          )}
          <Input.TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={intl.formatMessage({ id: 'ai.placeholder' })}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            disabled={!input.trim()}
            className="shrink-0 self-end"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : undefined }}
          />
        </div>
      </div>
    </div>
  )
}
