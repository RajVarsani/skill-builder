import { type RefObject, useState } from 'react'
import { domToPng } from 'modern-screenshot'

interface ShareButtonsProps {
  skillUrl: string
  skillName: string
  installCommand: string
  repoUrl?: string
  cardRef?: RefObject<HTMLDivElement | null>
}

export function ShareButtons({ skillUrl, skillName, installCommand, repoUrl, cardRef }: ShareButtonsProps) {
  const [downloading, setDownloading] = useState(false)

  const handleShareX = () => {
    const text = encodeURIComponent(`so I just made myself installable?\n\n${installCommand}\n\nan AI had a mass vibe coding conversation with me, pulled out what I actually know, and matched it against a massive skills registry.\n\ntry it:`)
    const url = encodeURIComponent(skillUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(`I just turned my professional identity into something installable.\n\n${installCommand}\n\nAn AI conducted a deep conversation with me - not a form or a quiz, an actual back-and-forth - extracted my skills and expertise, and matched them against a registry of thousands.\n\nThe output is a skill file that anyone can plug into their AI tools. Resumes describe you. This lets people install you.\n\nBuild yours: ${skillUrl}`)
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank')
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(skillUrl)
  }

  const handleDownloadImage = async () => {
    if (!cardRef?.current || downloading) return
    setDownloading(true)
    try {
      const card = cardRef.current

      // Temporarily expand scroll containers and hide toggle buttons for a clean capture
      const scrollContainers = card.querySelectorAll<HTMLElement>('.overflow-y-auto, .scrollbar-thin')
      const savedStyles: { el: HTMLElement; maxHeight: string; overflow: string }[] = []
      scrollContainers.forEach((el) => {
        savedStyles.push({ el, maxHeight: el.style.maxHeight, overflow: el.style.overflow })
        el.style.maxHeight = 'none'
        el.style.overflow = 'visible'
      })

      const dataUrl = await domToPng(cardRef.current, {
        scale: 2,
        backgroundColor: '#1a1008',
        filter: (node) => {
          // Hide expand/collapse toggle buttons from the capture
          if (node instanceof HTMLButtonElement && /more|less/i.test(node.textContent || '')) {
            return false
          }
          return true
        },
      })

      // Restore scroll containers
      savedStyles.forEach(({ el, maxHeight, overflow }) => {
        el.style.maxHeight = maxHeight
        el.style.overflow = overflow
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
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-3 px-6 border-2 border-surface font-display text-[10px] uppercase tracking-[0.04em] text-surface hover:bg-surface/5 transition-colors"
          >
            View on GitHub
          </a>
        )}
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
