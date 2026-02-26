'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { DOMAINS } from '@skill-builder/shared'

interface DomainSelectorProps {
  onSelect: (domains: string[]) => void
}

const spring = { type: 'spring' as const, stiffness: 160, damping: 22 }

export function DomainSelector({ onSelect }: DomainSelectorProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')

  function toggleDomain(domain: string) {
    setSelected((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    )
  }

  function addCustomDomain() {
    const trimmed = customInput.trim()
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed])
      setCustomInput('')
    }
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomDomain()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((domain) => {
          const isSelected = selected.includes(domain)
          return (
            <motion.button
              key={domain}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleDomain(domain)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                isSelected
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
              }`}
            >
              {domain}
            </motion.button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          placeholder="Add a custom domain..."
          className="flex-1 rounded-full bg-surface-muted px-4 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-text-primary/20"
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={addCustomDomain}
          disabled={!customInput.trim()}
          className="rounded-full bg-surface-muted p-2 text-text-secondary hover:bg-surface-muted/80 disabled:opacity-40"
        >
          <Plus size={18} />
        </motion.button>
      </div>

      {selected.filter((d) => !DOMAINS.includes(d as typeof DOMAINS[number])).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .filter((d) => !DOMAINS.includes(d as typeof DOMAINS[number]))
            .map((domain) => (
              <motion.button
                key={domain}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
                whileTap={{ scale: 0.96 }}
                onClick={() => toggleDomain(domain)}
                className="rounded-full bg-text-primary px-4 py-2 text-sm text-white"
              >
                {domain}
              </motion.button>
            ))}
        </div>
      )}

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={spring}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(selected)}
              className="w-full rounded-full bg-text-primary py-3 text-sm font-medium text-white transition-colors hover:bg-text-primary/90"
            >
              Continue with {selected.length} domain{selected.length !== 1 ? 's' : ''}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
