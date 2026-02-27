import { Nav } from '../components/layout/Nav'

export function Builder() {
  return (
    <div className="min-h-screen bg-page">
      <Nav step={1} />
      <div className="flex items-center justify-center p-8">
        <p className="font-mono text-sm text-muted">Builder — coming in Phase 2</p>
      </div>
    </div>
  )
}
