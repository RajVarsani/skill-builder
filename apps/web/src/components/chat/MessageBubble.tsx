interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-surface text-cream px-4 py-3 rounded-sm">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1 block">
          Skill Builder
        </span>
        <div className="bg-cream border border-muted/20 px-4 py-3 rounded-sm">
          <p className="text-sm leading-relaxed text-surface">{content}</p>
        </div>
      </div>
    </div>
  )
}
