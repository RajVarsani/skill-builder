export function Landing() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl uppercase tracking-wide text-surface">
          Skill Builder
        </h1>
        <p className="mt-4 text-muted">Landing page — coming in Phase 5</p>
        <a
          href="/sign-in"
          className="inline-block mt-6 px-6 py-3 bg-accent text-cream font-display text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors"
        >
          Get Started
        </a>
      </div>
    </div>
  )
}
