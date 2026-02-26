'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, GithubLogo, XLogo, LinkedinLogo } from '@phosphor-icons/react'
import { IdentityCard } from './identity-card'
import type { IdentityModel } from '@skill-builder/shared'

interface PublishViewProps {
  identity: IdentityModel
  installCommand: string
  skillPreview: string
}

export function PublishView({ identity, installCommand, skillPreview }: PublishViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col items-center px-6 py-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="text-4xl md:text-5xl font-light tracking-tighter text-text-primary text-center"
      >
        Your Identity is Live
      </motion.h1>

      {/* Install command */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
        className="mt-8 rounded-2xl bg-zinc-900 px-6 py-4 flex items-center gap-4 max-w-lg w-full"
      >
        <code className="flex-1 text-sm text-zinc-300 font-mono truncate">
          {installCommand}
        </code>
        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white transition-colors active:scale-95"
        >
          {copied ? <Check size={20} weight="bold" /> : <Copy size={20} />}
        </button>
      </motion.div>

      {/* Identity card — hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
        className="mt-12 w-full max-w-sm h-[480px]"
      >
        <IdentityCard identity={{ ...identity, completionPercent: 100 }} />
      </motion.div>

      {/* Share buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex items-center gap-3"
      >
        <span className="text-sm text-text-muted">Share:</span>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <XLogo size={18} />
        </button>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <LinkedinLogo size={18} />
        </button>
        <button className="rounded-full p-2.5 bg-surface-muted hover:bg-surface-muted/80 transition-colors text-text-secondary">
          <GithubLogo size={18} />
        </button>
      </motion.div>

      {/* Skill preview */}
      {skillPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 w-full max-w-2xl"
        >
          <h2 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
            Generated SKILL.md
          </h2>
          <div className="rounded-xl bg-zinc-900 p-6 overflow-x-auto">
            <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
              {skillPreview}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  )
}
