import { type RefObject, useState } from 'react'
import { domToPng } from 'modern-screenshot'

interface ShareButtonsProps {
  skillUrl: string
  skillName: string
  cardRef?: RefObject<HTMLDivElement | null>
}

export function ShareButtons({ skillUrl, skillName, cardRef }: ShareButtonsProps) {
  const [downloading, setDownloading] = useState(false)

  const handleShareX = () => {
    const username = skillName.replace('acting-as-', '')
    const text = encodeURIComponent(`I just made myself installable.\n\nnpx skills install ${username}\n\nBuild yours:`)
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

  const handleDownloadImage = async () => {
    if (!cardRef?.current || downloading) return
    setDownloading(true)
    try {
      const dataUrl = await domToPng(cardRef.current, {
        scale: 2,
        backgroundColor: '#1a1008',
      })
      const link = document.createElement('a')
      link.download = `${skillName.replace('acting-as-', '')}-skill-card.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to download card image:', err)
    } finally {
      setDownloading(false)
    }
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
        {cardRef && (
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex items-center justify-center py-3 px-6 border-2 border-accent bg-accent/10 font-display text-[10px] uppercase tracking-[0.04em] text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            {downloading ? 'Saving...' : 'Download Card'}
          </button>
        )}
      </div>
    </div>
  )
}
