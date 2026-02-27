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
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => handleChipClick(chip)}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded-sm transition-colors ${
            selected.has(chip)
              ? 'bg-accent text-cream border-accent'
              : 'bg-transparent text-surface border-surface/30 hover:border-surface'
          }`}
        >
          {multiSelect && selected.has(chip) && '✓ '}
          {chip}
        </button>
      ))}

      {multiSelect && (
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="px-4 py-1.5 text-xs font-display uppercase tracking-wider bg-accent text-cream rounded-sm disabled:opacity-30 hover:bg-accent/90 transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  )
}
