'use client'

import { motion } from 'framer-motion'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const spring = { type: 'spring' as const, stiffness: 180, damping: 22 }

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-text-primary text-white'
            : 'rounded-2xl rounded-bl-md bg-surface-muted text-text-primary'
        }`}
      >
        <span className="whitespace-pre-wrap">{content}</span>
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-[3px] animate-pulse rounded-full bg-current opacity-60" />
        )}
      </div>
    </motion.div>
  )
}
