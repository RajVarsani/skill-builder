import { useConversationStore } from '../../lib/store'

export function StreamingMessage() {
  const streamingText = useConversationStore((s) => s.streamingText)
  const isStreaming = useConversationStore((s) => s.isStreaming)

  if (!isStreaming && !streamingText) return null

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <span className="text-[9px] font-display uppercase tracking-[0.1em] text-muted mb-1 block">
          Skill Builder
        </span>
        <div className="bg-cream border-2 border-surface px-[18px] py-[14px]">
          <p className="text-[14px] font-body leading-[21px] text-surface-secondary">
            {streamingText}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
