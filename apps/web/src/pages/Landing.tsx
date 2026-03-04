import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { GlitchLogo } from '../components/GlitchLogo'
import { SparkleField } from '../components/effects/SparkleField'
import { SparkleButton } from '../components/effects/SparkleButton'

const STEPS = [
  {
    num: '01',
    label: 'Discover',
    title: 'Pick Your Domains',
    desc: 'Tell us what you do. Engineering, design, product, data — your persona starts with the areas you know best.',
  },
  {
    num: '02',
    label: 'Interview',
    title: 'Quick AI Interview',
    desc: 'An AI asks focused questions to understand how you think, what tools you reach for, and how you make decisions.',
  },
  {
    num: '03',
    label: 'Match',
    title: 'Find Your Skills',
    desc: 'Your answers get matched against the skills registry. Review the results, keep what fits, generate new ones.',
  },
  {
    num: '04',
    label: 'Publish',
    title: 'Go Live',
    desc: 'You get an installable SKILL.md file. Share your profile link — anyone can add your persona to their AI workflow.',
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

  // Wake up backend on Render free tier (cold start)
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  useEffect(() => {
    fetch(`${apiUrl}/health`).catch(() => {})
  }, [])

  const handleCTA = () => {
    navigate(isAuthenticated ? '/builder' : '/sign-in')
  }

  return (
    <div className="min-h-screen bg-page flex flex-col overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 md:px-[60px] py-4 md:py-5 border-b-[3px] border-surface">
        <GlitchLogo size="sm" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="font-body text-[14px] uppercase tracking-[0.08em] text-surface hover:text-accent transition-colors">
            How It Works
          </a>
          <SparkleButton
            onClick={handleCTA}
            className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[12px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Build Your Persona
          </SparkleButton>
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
          <SparkleButton
            onClick={handleCTA}
            className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[11px] uppercase tracking-[0.05em] text-cream cursor-pointer"
          >
            Build Your Persona
          </SparkleButton>
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

          {/* Katana divider */}
          <svg width="240" height="16" viewBox="0 0 240 16" fill="none" className="mt-5 md:mt-6 mb-5 md:mb-6">
  <rect x="0" y="6" width="4" height="4" fill="#E04A2F" />
  <rect x="8" y="6" width="4" height="4" fill="#A89880" />
  <rect x="16" y="6" width="4" height="4" fill="#E04A2F" />
  <rect x="30" y="5" width="50" height="6" fill="#1A1008" />
  <rect x="35" y="5" width="4" height="6" fill="#E04A2F" opacity={0.5} />
  <rect x="45" y="5" width="4" height="6" fill="#E04A2F" opacity={0.5} />
  <rect x="55" y="5" width="4" height="6" fill="#E04A2F" opacity={0.5} />
  <rect x="65" y="5" width="4" height="6" fill="#E04A2F" opacity={0.5} />
  <rect x="75" y="5" width="4" height="6" fill="#E04A2F" opacity={0.5} />
  <rect x="82" y="1" width="6" height="14" rx="1" fill="#E04A2F" />
  <polygon points="90,6 220,7 224,8 220,9 90,10" fill="#1A1008" />
  <line x1="92" y1="7" x2="218" y2="8" stroke="#A89880" strokeWidth={0.5} opacity={0.4} />
  <rect x="228" y="6" width="4" height="4" fill="#E04A2F" />
  <rect x="236" y="6" width="4" height="4" fill="#A89880" />
</svg>

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
                  <span className="font-display text-[8px] md:text-[9px] text-cream opacity-80 uppercase w-14 md:w-16 shrink-0">{label}</span>
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

      {/* The Output */}
      <section className="bg-surface flex flex-col items-center pt-12 md:pt-20 pb-12 md:pb-20 px-5 md:px-[60px]">
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          <div className="w-6 md:w-10 h-[2px] bg-accent" />
          <span className="font-display text-[11px] md:text-[12px] uppercase tracking-[0.15em] text-accent">
            The Result
          </span>
          <div className="w-6 md:w-10 h-[2px] bg-accent" />
        </div>

        <h2 className="font-display text-[24px] md:text-[42px] leading-[32px] md:leading-[52px] text-center text-cream uppercase mb-1">
          Your Skill, Published
        </h2>
        <p className="font-body text-[13px] md:text-[15px] leading-[20px] md:leading-[24px] text-center text-muted max-w-[500px] mb-8 md:mb-12">
          A GitHub repo and a single install command. That's it — your persona, ready to share.
        </p>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-[1100px]">
          {/* Terminal mockup */}
          <div className="flex-1 min-w-0 border-2 border-surface-secondary flex flex-col bg-[#2A2318]">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b-2 border-surface-secondary">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-accent" />
                <div className="w-3 h-3 bg-muted" />
                <div className="w-3 h-3 bg-surface-secondary" />
              </div>
              <span className="font-display text-[9px] md:text-[10px] text-muted tracking-[0.1em] uppercase">Terminal</span>
            </div>
            <div className="flex flex-col gap-4 md:gap-5 p-5 md:p-7 flex-1">
              <div className="flex items-start gap-3">
                <span className="font-code text-[13px] md:text-[14px] text-accent shrink-0">$</span>
                <span className="font-code text-[11px] md:text-[13px] text-cream leading-[22px]">
                  npx skills install<br />skill-builder-agent/acting-as-abhishek-naidu
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pl-6">
                <span className="font-code text-[10px] md:text-[12px] text-muted leading-[20px]">Fetching acting-as-abhishek-naidu...</span>
                <span className="font-code text-[10px] md:text-[12px] text-muted leading-[20px]">Installing SKILL.md + 3 references</span>
              </div>
              <div className="flex items-center gap-2.5 pl-6">
                <div className="w-2 h-2 bg-[#4CAF50] shrink-0" />
                <span className="font-code text-[11px] md:text-[13px] text-cream leading-[20px]">Done! Persona installed successfully.</span>
              </div>
            </div>
          </div>

          {/* GitHub repo mockup */}
          <div className="flex-1 min-w-0 border-2 border-[#D0D7DE] flex flex-col bg-white">
            <div className="flex items-center gap-2.5 px-4 md:px-5 py-3 md:py-4 border-b border-[#D0D7DE]">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="#24292f" className="shrink-0"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              <span className="font-body text-[14px] md:text-[16px] font-semibold text-[#24292f] truncate">acting-as-abhishek-naidu</span>
              <span className="px-2 py-0.5 border border-[#D0D7DE] font-body text-[10px] md:text-[11px] text-[#656D76] shrink-0">Public</span>
            </div>
            <div className="flex items-center gap-3 px-4 md:px-5 py-2.5 border-b border-[#D0D7DE]">
              <span className="px-2.5 py-1 border border-[#D0D7DE] bg-[#F6F8FA] font-body text-[12px] text-[#24292f]">main</span>
              <span className="font-body text-[12px] text-[#656D76]">1 Branch</span>
              <span className="font-body text-[12px] text-[#656D76]">0 Tags</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 md:px-5 py-2.5 border-b border-[#D0D7DE] bg-[#F6F8FA]">
              <span className="font-body text-[12px] font-semibold text-[#24292f] shrink-0">abhishek</span>
              <span className="font-body text-[12px] text-[#656D76] truncate">Update references/matched/...</span>
              <span className="font-code text-[11px] text-[#656D76] shrink-0">32b218d</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 md:px-5 py-2.5 border-b border-[#D0D7DE]">
              <div className="w-4 h-4 bg-[#54AEFF] shrink-0" />
              <span className="font-body text-[13px] text-[#24292f] truncate">acting-as-abhishek-naidu</span>
              <span className="font-body text-[12px] text-[#656D76] hidden md:block truncate ml-auto">Update references/matched...</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 md:px-5 py-2.5">
              <div className="w-4 h-4 border border-[#D0D7DE] shrink-0" />
              <span className="font-body text-[13px] text-[#24292f]">README.md</span>
              <span className="font-body text-[12px] text-[#656D76] ml-auto">Initial commit</span>
            </div>
          </div>
        </div>
      </section>

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
      <section className="bg-surface flex flex-col items-center py-12 md:py-20 px-5 md:px-[60px] relative overflow-hidden">
        <SparkleField />
        <div className="flex gap-2 mb-5 md:mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 ${i < 2 ? 'bg-accent' : 'bg-muted'}`} />
          ))}
        </div>

        <h2 className="font-display text-[28px] md:text-[48px] leading-[36px] md:leading-[64px] text-center text-cream uppercase">
          Your Persona
        </h2>
        <h2 className="font-display text-[28px] md:text-[48px] leading-[36px] md:leading-[64px] text-center text-accent uppercase">
          Is Not a Resume
        </h2>

        <p className="font-body text-[14px] md:text-[16px] leading-[22px] md:leading-[26px] text-center text-muted max-w-[480px] mt-4 md:mt-5 mb-6 md:mb-8">
          In the agentic era, identity is skills. Build yours in few minutes.
          Make yourself installable.
        </p>

        <div className="flex flex-col text-center sm:flex-row gap-3 md:gap-4 w-full sm:w-auto relative z-10">
          <SparkleButton
            onClick={handleCTA}
            className="px-8 py-3 md:py-3.5 bg-accent border-[3px] border-cream font-display text-[12px] md:text-[14px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Start Building
          </SparkleButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-2 md:grid md:grid-cols-3 md:items-center px-5 md:px-[60px] py-4 md:py-5 border-t-[3px] border-surface">
        <span className="font-body text-[11px] md:text-[12px] uppercase tracking-[0.08em] text-muted">
          2026 <GlitchLogo size="xs" />
        </span>
        <span className="font-body text-[10px] md:text-[11px] tracking-[0.06em] text-muted text-center whitespace-nowrap">
          Built by{' '}
          <a href="https://x.com/abhisheknaiidu" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 transition-colors">Abhishek Naidu</a>
          {' '}&{' '}
          <a href="https://x.com/RajVarsani404" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 transition-colors">Raj Varsani</a>
        </span>
        <div />
      </footer>
    </div>
  )
}
