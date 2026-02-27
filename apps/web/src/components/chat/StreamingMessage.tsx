import { useConversationStore } from '../../lib/store'

export function StreamingMessage() {
  const streamingText = useConversationStore((s) => s.streamingText)
  const isStreaming = useConversationStore((s) => s.isStreaming)

  if (!isStreaming && !streamingText) return null

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1 block">
          Skill Builder
        </span>
        <div className="bg-cream border border-muted/20 px-4 py-3 rounded-sm">
          <p className="text-sm leading-relaxed text-surface">
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
