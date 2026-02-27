import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'

const STEPS = [
  {
    num: '01',
    label: 'Discover',
    title: 'Pick Your Domains',
    desc: 'Select the areas you work in. Frontend, backend, design, data — you choose the starting blocks.',
  },
  {
    num: '02',
    label: 'Interview',
    title: 'AI Deep Dive',
    desc: 'An AI interviewer asks targeted questions about your experience, tools, and problem-solving style.',
  },
  {
    num: '03',
    label: 'Review',
    title: 'Prove Your Skills',
    desc: 'Review matched skills from 75K+ in the registry. Confirm, remove, or let the AI generate custom ones.',
  },
  {
    num: '04',
    label: 'Publish',
    title: 'Ship Your Identity',
    desc: 'Get an installable SKILL.md file. Share it, add it to your repo, let Claude know who you are.',
  },
]

export function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleCTA = () => {
    navigate(isAuthenticated ? '/builder' : '/sign-in')
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-[60px] py-5 border-b-[3px] border-surface">
        <span className="font-display text-[16px] uppercase tracking-[0.05em] text-surface">
          Skill Builder
        </span>
        <div className="flex items-center gap-8">
          <a href="#how-it-works" className="font-body text-[14px] uppercase tracking-[0.08em] text-surface hover:text-accent transition-colors">
            How It Works
          </a>
          <a href="#examples" className="font-body text-[14px] uppercase tracking-[0.08em] text-surface hover:text-accent transition-colors">
            Examples
          </a>
          <button
            onClick={handleCTA}
            className="bg-accent border-[3px] border-surface px-6 py-2.5 font-display text-[12px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors"
          >
            Build Yours
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center pt-20 pb-16 px-[60px]">
        <div className="border-4 border-accent px-[60px] py-12 flex flex-col items-center max-w-[900px] w-full">
          <h1 className="font-display text-[64px] leading-[80px] tracking-[0.02em] text-center text-surface uppercase">
            Build Your
          </h1>
          <h1 className="font-display text-[64px] leading-[80px] tracking-[0.02em] text-center text-accent uppercase">
            Expertise
          </h1>
          <h1 className="font-display text-[64px] leading-[80px] tracking-[0.02em] text-center text-surface uppercase">
            Block by Block
          </h1>

          <div className="w-[120px] h-1 bg-surface mt-6 mb-6" />

          <p className="font-body text-[18px] leading-[28px] text-center text-surface-secondary max-w-[600px]">
            An AI interviews you about what you know. It assembles your skills
            into an installable identity — pixel by pixel.
          </p>
        </div>
      </section>

      {/* Sample card preview */}
      <section className="flex justify-center pb-8">
        <div className="border-[3px] border-accent bg-surface w-[520px] overflow-hidden">
          {/* Mini pixel bar */}
          <div className="flex h-2.5">
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

          <div className="px-6 py-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent flex items-center justify-center shrink-0">
                <span className="font-display text-[12px] text-cream">SN</span>
              </div>
              <div>
                <span className="font-display text-[14px] text-cream uppercase block">Sarah Nakamura</span>
                <span className="font-body text-[10px] text-muted uppercase tracking-[0.1em]">Full-Stack Engineer</span>
              </div>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['React', 'TypeScript', 'Node.js', 'Postgres', 'GraphQL', 'AWS'].map((s, i) => (
                <span
                  key={s}
                  className={`px-2.5 py-1 text-[9px] font-display uppercase ${
                    i < 2 ? 'bg-accent text-cream' : 'bg-[#E04A2F26] text-accent border border-accent'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Skill bars */}
            <div className="space-y-1.5 mb-4">
              {['Frontend', 'Backend', 'DevOps'].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-display text-[9px] text-cream uppercase w-16 shrink-0">{label}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 ${
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
              <span className="font-display text-[9px] text-accent uppercase">Completion</span>
              <span className="font-display text-[16px] text-accent">87</span>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative pixel dots */}
      <div className="flex justify-center gap-1 py-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 ${
              [0, 1, 3, 4, 7, 8, 10, 11].includes(i) ? (
                [0, 3, 7, 10].includes(i) ? 'bg-surface' : [1, 4].includes(i) ? 'bg-accent' : 'bg-surface'
              ) : ''
            }`}
          />
        ))}
      </div>

      {/* How it works */}
      <section id="how-it-works" className="flex flex-col items-center pt-16 pb-10 px-[60px] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-[3px] bg-muted/30" />
          <span className="font-display text-[12px] uppercase tracking-[0.15em] text-accent">
            How It Works
          </span>
          <div className="w-10 h-[3px] bg-muted/30" />
        </div>

        <h2 className="font-display text-[40px] leading-[52px] text-center text-surface uppercase">
          Four Steps to Your
        </h2>
        <h2 className="font-display text-[40px] leading-[52px] text-center text-surface uppercase">
          Skill Identity
        </h2>
      </section>

      {/* Step cards */}
      <section className="flex gap-4 px-[60px] pb-16">
        {STEPS.map((step) => (
          <div key={step.num} className="flex-1 border-[3px] border-surface flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface">
              <span className="font-display text-[10px] text-accent">{step.num}</span>
              <span className="font-display text-[10px] text-cream uppercase">{step.label}</span>
            </div>
            <div className="flex flex-col gap-2.5 px-4 py-5 bg-cream">
              <h3 className="font-display text-[14px] leading-[22px] text-surface uppercase">
                {step.title}
              </h3>
              <p className="font-body text-[14px] leading-[22px] text-surface-secondary">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA section — dark bg */}
      <section className="bg-surface flex flex-col items-center py-20 px-[60px]">
        <div className="flex gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 ${i < 2 ? 'bg-accent' : 'bg-muted'}`} />
          ))}
        </div>

        <h2 className="font-display text-[48px] leading-[64px] text-center text-cream uppercase">
          Ready to Build
        </h2>
        <h2 className="font-display text-[48px] leading-[64px] text-center text-accent uppercase">
          Your Blocks?
        </h2>

        <p className="font-body text-[16px] leading-[26px] text-center text-muted max-w-[480px] mt-5 mb-8">
          Your expertise deserves to be structured, portable, and
          installable. Start the interview.
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleCTA}
            className="px-8 py-3.5 bg-accent border-[3px] border-cream font-display text-[14px] uppercase tracking-[0.05em] text-cream hover:bg-accent/90 transition-colors"
          >
            Start Building
          </button>
          <button className="px-8 py-3.5 border-[3px] border-muted font-display text-[14px] uppercase tracking-[0.05em] text-muted hover:border-cream hover:text-cream transition-colors">
            View Examples
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between px-[60px] py-5 border-t-[3px] border-surface">
        <span className="font-body text-[12px] uppercase tracking-[0.08em] text-muted">
          2026 Skill Builder
        </span>
        <div className="flex items-center gap-6">
          <a href="#" className="font-body text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            GitHub
          </a>
          <a href="#" className="font-body text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            Docs
          </a>
          <a href="#" className="font-body text-[12px] uppercase tracking-[0.08em] text-muted hover:text-surface transition-colors">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  )
}
