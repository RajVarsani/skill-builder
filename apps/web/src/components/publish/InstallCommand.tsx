import { useState } from 'react'

interface InstallCommandProps {
  command: string
}

export function InstallCommand({ command }: InstallCommandProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-display uppercase tracking-[0.08em] text-muted block">
        Install Command
      </span>

      <div className="flex items-center gap-3 bg-surface border-[3px] border-accent px-3 md:px-[18px] py-[14px]">
        <span className="text-[12px] md:text-[13px] font-body tracking-[0.02em] text-accent flex-1 break-all">
          {command}
        </span>
        <button
          onClick={handleCopy}
          className="bg-accent px-3.5 py-1.5 text-[9px] font-display text-cream uppercase shrink-0 hover:bg-accent/90 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
