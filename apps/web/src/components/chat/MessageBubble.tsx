import Markdown from 'react-markdown'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] bg-surface text-cream px-[18px] py-2.5">
          <p className="text-[13px] font-body leading-[20px]">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <span className="text-[9px] font-display uppercase tracking-[0.1em] text-muted mb-1 block">
          Skill Builder
        </span>
        <div className="bg-cream border-2 border-surface px-[18px] py-[14px]">
          <div className="text-[14px] font-body leading-[21px] text-surface-secondary prose-msg">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
