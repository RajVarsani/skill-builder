import Markdown from 'react-markdown'
import { useConversationStore } from '../../lib/store'

function PixelLoader() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-accent"
          style={{
            animation: `pixelBounce 1s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function ToolActivityIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-muted/15">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-accent"
            style={{
              animation: `pixelBounce 0.8s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] font-display uppercase tracking-[0.06em] text-muted">
        {label}...
      </span>
    </div>
  )
}

export function StreamingMessage() {
  const streamingText = useConversationStore((s) => s.streamingText)
  const isStreaming = useConversationStore((s) => s.isStreaming)
  const toolActivity = useConversationStore((s) => s.toolActivity)

  if (!isStreaming && !streamingText) return null

  const showToolActivity = isStreaming && toolActivity && !streamingText

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <span className="text-[9px] font-display uppercase tracking-[0.1em] text-muted mb-1 block">
          actingas
        </span>
        <div className="bg-cream border-2 border-surface px-[18px] py-[14px]">
          {isStreaming && !streamingText && !toolActivity ? (
            <PixelLoader />
          ) : showToolActivity ? (
            <div>
              <PixelLoader />
              <ToolActivityIndicator label={toolActivity} />
            </div>
          ) : (
            <div>
              <div className="text-[14px] font-body leading-[21px] text-surface-secondary prose-msg">
                <Markdown>{streamingText}</Markdown>
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
                )}
              </div>
              {isStreaming && toolActivity && (
                <ToolActivityIndicator label={toolActivity} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
