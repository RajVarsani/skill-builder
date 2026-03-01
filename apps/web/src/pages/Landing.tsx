import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'

const STEPS = [
  {
    num: '01',
    label: 'Discover',
    title: 'Choose Your Class',
    desc: 'Select your domains. Engineering, design, data, product — every persona starts with a class.',
  },
  {
    num: '02',
    label: 'Interview',
    title: '3-Minute Interview',
    desc: 'An AI agent asks rapid-fire questions. It infers your expertise, tools, and decision-making style in real time.',
  },
  {
    num: '03',
    label: 'Match',
    title: 'Match 75K+ Skills',
    desc: 'Your answers are matched against the entire skills.sh registry. Confirm, reject, or let it generate custom ones.',
  },
  {
    num: '04',
    label: 'Publish',
    title: 'Publish & Install',
    desc: 'Get a SKILL.md file. Anyone can run npx skills install you. Your persona is now part of every AI workflow.',
  },
]

function PixelDotRow() {
  // Generate enough dots to fill any screen width (~60 pairs)
  const dots = Array.from({ length: 60 })
  return (
    <div className="flex justify-center gap-1 py-6 overflow-hidden w-full">
      {dots.map((_, i) => {
        const mod = i % 5
        const bg =
          mod === 0 ? 'bg-surface' :
          mod === 1 ? 'bg-accent' :
          mod === 2 ? '' :
          mod === 3 ? 'bg-surface' :
          'bg-surface'
        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 shrink-0 ${bg}`}
          />
        )
      })}
    </div>
  )
}

export function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleCTA = () => {
    navigate(isAuthenticated ? '/builder' : '/sign-in')
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 md:px-[60px] py-4 md:py-5 border-b-[3px] border-surface">
        <span className="font-display text-[14px] md:text-[16px] uppercase tracking-[0.05em] text-surface">
          actingas
        </span>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="font-body text-[14px] uppercase tracking-[0.08em] text-surface hover:text-accent transition-colors">
            How It Works
          </a>
          <button
            onClick={handleCTA}
            className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[12px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors"
          >
            Build Your Persona
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-1"
        >
          <div className="w-5 h-0.5 bg-surface" />
          <div className="w-5 h-0.5 bg-surface" />
          <div className="w-5 h-0.5 bg-surface" />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col items-center gap-4 py-4 border-b-[3px] border-surface bg-cream">
          <a href="#how-it-works" className="font-body text-[13px] uppercase tracking-[0.08em] text-surface">
            How It Works
          </a>
          <button
            onClick={handleCTA}
            className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[11px] uppercase tracking-[0.05em] text-cream"
          >
            Build Your Persona
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center pt-10 md:pt-20 pb-10 md:pb-16 px-5 md:px-[60px]">
        <div className="border-4 border-accent px-5 md:px-[60px] py-8 md:py-12 flex flex-col items-center max-w-[900px] w-full">
          <h1 className="font-display text-[32px] md:text-[48px] lg:text-[64px] leading-[40px] md:leading-[60px] lg:leading-[80px] tracking-[0.02em] text-center text-surface uppercase">
            Build Your Persona
          </h1>
          <h1 className="font-display text-[32px] md:text-[48px] lg:text-[64px] leading-[40px] md:leading-[60px] lg:leading-[80px] tracking-[0.02em] text-center text-accent uppercase">
            As An Agent
          </h1>

          <div className="w-[80px] md:w-[120px] h-1 bg-surface mt-5 md:mt-6 mb-5 md:mb-6" />

          <p className="font-body text-[14px] md:text-[18px] leading-[22px] md:leading-[28px] text-center text-surface-secondary max-w-[600px]">
            An AI builds your persona. Block by block.
            {' '}Make yourself installable.
          </p>
        </div>
      </section>

      {/* Sample card preview */}
      <section className="flex justify-center pb-6 md:pb-8 px-5 md:px-0">
        <div className="border-[3px] border-accent bg-surface w-full max-w-[520px] overflow-hidden">
          {/* Mini pixel bar */}
          <div className="flex h-2 md:h-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 ${
                  [0, 1, 3, 4, 6, 7].includes(i)
                    ? i % 3 === 0 ? 'bg-accent' : 'bg-surface-secondary'
                    : 'bg-cream/10'
                }`}
              />
            ))}
          </div>

          <div className="px-4 md:px-6 py-4 md:py-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-accent flex items-center justify-center shrink-0">
                <span className="font-display text-[10px] md:text-[12px] text-cream">SN</span>
              </div>
              <div>
                <span className="font-display text-[12px] md:text-[14px] text-cream uppercase block">Sarah Nakamura</span>
                <span className="font-body text-[9px] md:text-[10px] text-muted uppercase tracking-[0.1em]">Full-Stack Engineer</span>
              </div>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
              {['React', 'TypeScript', 'Node.js', 'Postgres', 'GraphQL', 'AWS'].map((s, i) => (
                <span
                  key={s}
                  className={`px-2 md:px-2.5 py-1 text-[8px] md:text-[9px] font-display uppercase ${
                    i < 2 ? 'bg-accent text-cream' : 'bg-[#E04A2F26] text-accent border border-accent'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Skill bars */}
            <div className="space-y-1.5 mb-3 md:mb-4">
              {['Frontend', 'Backend', 'DevOps'].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-display text-[8px] md:text-[9px] text-cream uppercase w-14 md:w-16 shrink-0">{label}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 md:w-2.5 md:h-2.5 ${
                          i < (label === 'Frontend' ? 7 : label === 'Backend' ? 6 : 4)
                            ? i < 3 ? 'bg-accent' : 'bg-surface-secondary'
                            : 'bg-cream/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Completion bar */}
            <div className="flex items-center justify-between bg-accent/20 px-3 py-2">
              <span className="font-display text-[8px] md:text-[9px] text-accent uppercase">Completion</span>
              <span className="font-display text-[14px] md:text-[16px] text-accent">87</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width decorative pixel dots */}
      <PixelDotRow />

      {/* How it works */}
      <section id="how-it-works" className="flex flex-col items-center pt-10 md:pt-16 pb-6 md:pb-10 px-5 md:px-[60px] gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 md:w-10 h-[3px] bg-muted/30" />
          <span className="font-display text-[11px] md:text-[12px] uppercase tracking-[0.15em] text-accent">
            How It Works
          </span>
          <div className="w-6 md:w-10 h-[3px] bg-muted/30" />
        </div>

        <h2 className="font-display text-[24px] md:text-[40px] leading-[32px] md:leading-[52px] text-center text-surface uppercase">
          Four Steps to Your
        </h2>
        <h2 className="font-display text-[24px] md:text-[40px] leading-[32px] md:leading-[52px] text-center text-surface uppercase">
          Skill Identity
        </h2>
      </section>

      {/* Step cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-5 md:px-[60px] pb-10 md:pb-16 max-w-[1200px] mx-auto w-full">
        {STEPS.map((step) => (
          <div key={step.num} className="border-[3px] border-surface flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface">
              <span className="font-display text-[10px] text-accent">{step.num}</span>
              <span className="font-display text-[10px] text-cream uppercase">{step.label}</span>
            </div>
            <div className="flex flex-col gap-2 md:gap-2.5 px-4 py-4 md:py-5 bg-cream flex-1">
              <h3 className="font-display text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-surface uppercase">
                {step.title}
              </h3>
              <p className="font-body text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] text-surface-secondary">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA section — dark bg */}
      <section className="bg-surface flex flex-col items-center py-12 md:py-20 px-5 md:px-[60px]">
        <div className="flex gap-2 mb-5 md:mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 ${i < 2 ? 'bg-accent' : 'bg-muted'}`} />
          ))}
        </div>

        <h2 className="font-display text-[28px] md:text-[48px] leading-[36px] md:leading-[64px] text-center text-cream uppercase">
          Your Persona
        </h2>
        <h2 className="font-display text-[28px] md:text-[48px] leading-[36px] md:leading-[64px] text-center text-accent uppercase">
          Is Not a PDF
        </h2>

        <p className="font-body text-[14px] md:text-[16px] leading-[22px] md:leading-[26px] text-center text-muted max-w-[480px] mt-4 md:mt-5 mb-6 md:mb-8">
          In the agent era, identity is code. Build yours in 3 minutes.
          Make yourself installable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
          <button
            onClick={handleCTA}
            className="px-8 py-3 md:py-3.5 bg-accent border-[3px] border-cream font-display text-[12px] md:text-[14px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors"
          >
            Start Building
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('how-it-works')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-8 py-3 md:py-3.5 border-[3px] border-muted font-display text-[12px] md:text-[14px] uppercase tracking-[0.05em] text-muted hover:border-cream hover:text-cream transition-colors"
          >
            See Example Persona
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 md:px-[60px] py-4 md:py-5 border-t-[3px] border-surface">
        <span className="font-body text-[11px] md:text-[12px] uppercase tracking-[0.08em] text-muted">
          2026 actingas
        </span>
        <div className="flex items-center gap-4 md:gap-6">
          <a href="#" className="font-body text-[11px] md:text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            GitHub
          </a>
          <a href="#" className="font-body text-[11px] md:text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            Docs
          </a>
          <a href="#" className="font-body text-[11px] md:text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  )
}
