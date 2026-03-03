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
    const text = encodeURIComponent(`npx skills install ${username}\n\nthat's me. installable. an AI interviewed me and matched my skills against 75K+ in the registry.\n\nyour move:`)
    const url = encodeURIComponent(skillUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    const username = skillName.replace('acting-as-', '')
    const text = encodeURIComponent(`npx skills install ${username}\n\nAn AI interviewed me, discovered my expertise across engineering, design, and product, matched it against 75K+ skills, and made me installable.\n\nYour persona is not a resume anymore. Build yours: ${skillUrl}`)
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
