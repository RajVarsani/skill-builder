import { useState } from 'react'
import { useConversationStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

interface SkillMarkdownEditorProps {
  onRegenerate: () => void
  isLoading: boolean
}

export function SkillMarkdownEditor({ onRegenerate, isLoading }: SkillMarkdownEditorProps) {
  const skillMarkdown = useConversationStore((s) => s.skillMarkdown)
  const setSkillMarkdown = useConversationStore((s) => s.setSkillMarkdown)
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
          Your SKILL.md
        </span>
        <div className="border-2 border-muted/30 bg-surface/5 p-6 flex items-center justify-center">
          <span className="text-[12px] font-mono text-muted animate-pulse">
            Generating preview...
          </span>
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
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[10px] font-display uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <textarea
          value={skillMarkdown}
          onChange={(e) => setSkillMarkdown(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[320px] max-h-[500px] p-4 bg-[#1a1a1a] text-[#e0d6cc] font-mono text-[12px] leading-[1.6] border-2 border-muted/30 resize-y focus:outline-none focus:border-accent/50 selection:bg-accent/30"
          style={{ tabSize: 2 }}
        />
      )}

      <p className="text-[10px] font-body text-muted/60">
        Edit the markdown above to customize your published skill. Changes are saved when you publish.
      </p>
    </div>
  )
}
