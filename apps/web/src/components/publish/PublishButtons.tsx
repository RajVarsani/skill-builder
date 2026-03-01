import { getGitHubConnectUrl } from '../../pages/SignIn'

interface PublishButtonsProps {
  onPublish: () => void
  onPublishGitHub: () => void
  isPublishing: boolean
  hasGithub: boolean
}

function PixelDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 bg-current"
          style={{ animation: `pixelBounce 0.8s ease-in-out ${i * 0.1}s infinite` }}
        />
      ))}
    </span>
  )
}

export function PublishButtons({ onPublish, onPublishGitHub, isPublishing, hasGithub }: PublishButtonsProps) {
  const handleGitHubClick = () => {
    if (!hasGithub) {
      window.location.href = getGitHubConnectUrl()
      return
    }
    onPublishGitHub()
  }

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
        Publish Your Skill
      </span>

      <div className="flex gap-2">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-7 bg-accent text-cream font-display text-[11px] uppercase tracking-[0.04em] disabled:opacity-80 hover:bg-accent/90 transition-colors"
        >
          {isPublishing ? (
            <>
              <PixelDots />
              <span>Publishing</span>
              <PixelDots />
            </>
          ) : (
            'Publish to Skill Builder'
          )}
        </button>

        <button
          onClick={handleGitHubClick}
          disabled={isPublishing}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-7 border-2 border-surface text-surface font-display text-[11px] uppercase tracking-[0.04em] disabled:opacity-80 hover:bg-surface/5 transition-colors"
        >
          {isPublishing ? (
            <>
              <PixelDots />
              <span>Publishing</span>
              <PixelDots />
            </>
          ) : hasGithub ? (
            'Publish to GitHub'
          ) : (
            'Connect GitHub'
          )}
        </button>
      </div>
    </div>
  )
}
