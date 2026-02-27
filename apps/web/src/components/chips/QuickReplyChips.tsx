import { useState } from 'react'
import { useConversationStore } from '../../lib/store'

interface QuickReplyChipsProps {
  onSelect: (value: string) => void
}

export function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  const chips = useConversationStore((s) => s.chips)
  const multiSelect = useConversationStore((s) => s.chipsMultiSelect)
  const isStreaming = useConversationStore((s) => s.isStreaming)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (chips.length === 0 || isStreaming) return null

  const handleChipClick = (chip: string) => {
    if (multiSelect) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(chip)) {
          next.delete(chip)
        } else {
          next.add(chip)
        }
        return next
      })
    } else {
      onSelect(chip)
    }
  }

  const handleContinue = () => {
    if (selected.size > 0) {
      onSelect(Array.from(selected).join(', '))
      setSelected(new Set())
    }
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {chips.map((chip) => {
        const isOther = chip.toLowerCase().includes('other')
        return (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            className={`px-5 py-2.5 text-[11px] font-display uppercase transition-colors ${
              selected.has(chip)
                ? 'bg-accent text-cream border-2 border-accent'
                : isOther
                  ? 'bg-transparent text-muted border-2 border-dashed border-muted'
                  : 'bg-transparent text-surface border-2 border-surface hover:bg-surface/5'
            }`}
          >
            {multiSelect && selected.has(chip) && '✓ '}
            {chip}
          </button>
        )
      })}

      {multiSelect && (
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="px-5 py-2.5 text-[11px] font-display uppercase bg-accent text-cream border-2 border-accent disabled:opacity-30 hover:bg-accent/90 transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  )
}
