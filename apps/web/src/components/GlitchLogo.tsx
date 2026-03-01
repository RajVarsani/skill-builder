interface GlitchLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  plain?: boolean
  className?: string
}

const sizes = {
  xs: 'text-[9px]',
  sm: 'text-[14px] md:text-[16px]',
  md: 'text-[24px] md:text-3xl',
  lg: 'text-[32px] md:text-[48px]',
}

export function GlitchLogo({ size = 'sm', plain = false, className = '' }: GlitchLogoProps) {
  if (plain) {
    return (
      <span
        className={`inline-block font-display uppercase tracking-[0.05em] text-muted ${sizes[size]} ${className}`}
      >
        acting as
      </span>
    )
  }

  return (
    <span
      className={`inline-block font-display uppercase tracking-[0.05em] ${sizes[size]} ${className}`}
    >
      <span className="text-surface">acting </span>
      <span className="text-accent">as</span>
    </span>
  )
}
