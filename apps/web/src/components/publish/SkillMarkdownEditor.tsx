import { useCallback, useEffect, useRef } from 'react'
import { useConversationStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

interface SkillMarkdownEditorProps {
  onRegenerate: () => void
  isLoading: boolean
}

export function SkillMarkdownEditor({ onRegenerate, isLoading }: SkillMarkdownEditorProps) {
  const skillMarkdown = useConversationStore((s) => s.skillMarkdown)
  const setSkillMarkdown = useConversationStore((s) => s.setSkillMarkdown)
  const conversationId = useConversationStore((s) => s.conversationId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (skillMarkdown) autoResize()
  }, [skillMarkdown, autoResize])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
          Your SKILL.md
        </span>
        <div className="border-2 border-muted/30 bg-[#1a1a1a] p-5 space-y-4">
          {/* Frontmatter skeleton */}
          <div className="space-y-2">
            <div className="h-2 w-8 bg-accent/30 rounded-sm" />
            <div className="h-2 w-48 bg-[#e0d6cc]/15 rounded-sm animate-pulse" />
            <div className="h-2 w-72 bg-[#e0d6cc]/15 rounded-sm animate-pulse [animation-delay:100ms]" />
            <div className="h-2 w-8 bg-accent/30 rounded-sm" />
          </div>
          {/* Heading skeleton */}
          <div className="h-3 w-36 bg-[#e0d6cc]/20 rounded-sm animate-pulse [animation-delay:200ms]" />
          {/* Paragraph skeleton */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:300ms]" />
            <div className="h-2 w-[85%] bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:400ms]" />
            <div className="h-2 w-[70%] bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:500ms]" />
          </div>
          {/* Section heading */}
          <div className="h-3 w-52 bg-[#e0d6cc]/20 rounded-sm animate-pulse [animation-delay:600ms]" />
          {/* Bullet list skeleton */}
          <div className="space-y-2 pl-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent/40 shrink-0" />
              <div className="h-2 w-[80%] bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:700ms]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent/40 shrink-0" />
              <div className="h-2 w-[65%] bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:800ms]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent/40 shrink-0" />
              <div className="h-2 w-[75%] bg-[#e0d6cc]/10 rounded-sm animate-pulse [animation-delay:900ms]" />
            </div>
          </div>
          {/* Loading label */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#e0d6cc]/10">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-accent"
                  style={{ animation: `pixelBounce 1s ease-in-out ${i * 0.12}s infinite` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-display uppercase tracking-[0.08em] text-[#e0d6cc]/40">
              Generating SKILL.md
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!skillMarkdown) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted">
          Your SKILL.md
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onRegenerate}
            className="text-[10px] font-display uppercase tracking-[0.08em] text-accent hover:text-accent/80 transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={skillMarkdown}
        onChange={(e) => {
          const value = e.target.value
          setSkillMarkdown(value)
          autoResize()
          if (conversationId) {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
              apiFetch(`/conversations/${conversationId}/skill-markdown`, {
                method: 'PATCH',
                body: JSON.stringify({ markdown: value }),
              }).catch(console.error)
            }, 1000)
          }
        }}
        spellCheck={false}
        className="w-full min-h-[200px] p-4 bg-[#1a1a1a] text-[#e0d6cc] font-mono text-[12px] leading-[1.6] border-2 border-muted/30 resize-none focus:outline-none focus:border-accent/50 selection:bg-accent/30 overflow-hidden"
        style={{ tabSize: 2 }}
      />

      <p className="text-[10px] font-body text-muted/60">
        Edit the markdown above to customize your published skill. Changes are saved when you publish.
      </p>
    </div>
  )
}
