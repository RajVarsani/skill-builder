interface PublishButtonsProps {
  onPublish: () => void
  onPublishGitHub: () => void
  isPublishing: boolean
}

export function PublishButtons({ onPublish, onPublishGitHub, isPublishing }: PublishButtonsProps) {
  return (
    <div className="space-y-3">
      <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
        Publish Your Skill
      </span>

      <div className="flex gap-2">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex-1 flex items-center justify-center py-3.5 px-7 bg-accent text-cream font-display text-[11px] uppercase tracking-[0.04em] disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {isPublishing ? 'Publishing...' : 'Publish to Skill Builder'}
        </button>

        <button
          onClick={onPublishGitHub}
          disabled={isPublishing}
          className="flex-1 flex items-center justify-center py-3.5 px-7 border-2 border-surface text-surface font-display text-[11px] uppercase tracking-[0.04em] disabled:opacity-50 hover:bg-surface/5 transition-colors"
        >
          Publish to GitHub
        </button>
      </div>
    </div>
  )
}
