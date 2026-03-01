interface ShareButtonsProps {
  skillUrl: string
  skillName: string
}

export function ShareButtons({ skillUrl, skillName }: ShareButtonsProps) {
  const handleShareX = () => {
    const username = skillName.replace('acting-as-', '')
    const text = encodeURIComponent(`I just made myself installable.\n\nskills install ${username}\n\nBuild yours:`)
    const url = encodeURIComponent(skillUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(skillUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(skillUrl)
  }

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
        Share Your Skill
      </span>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShareX}
          className="flex items-center justify-center py-3 px-6 border-2 border-surface font-display text-[10px] uppercase tracking-[0.04em] text-surface hover:bg-surface/5 transition-colors"
        >
          Share on X
        </button>
        <button
          onClick={handleShareLinkedIn}
          className="flex items-center justify-center py-3 px-6 border-2 border-surface font-display text-[10px] uppercase tracking-[0.04em] text-surface hover:bg-surface/5 transition-colors"
        >
          LinkedIn
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center py-3 px-6 border-2 border-surface font-display text-[10px] uppercase tracking-[0.04em] text-surface hover:bg-surface/5 transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  )
}
