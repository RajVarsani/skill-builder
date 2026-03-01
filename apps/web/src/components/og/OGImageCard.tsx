export interface OGImageCardProps {
  name: string
  title: string
  blocksDiscovered: number
  skillsMatched: number
  completionPercent: number
  traits: string[]
  skills: Array<{ name: string; installs: number }>
}

const COLORS = {
  bg: '#2A2520',
  bgDark: '#221E1B',
  cream: '#F5E6D3',
  coral: '#E85D3A',
  muted: '#8A8070',
  border: '#3A3530',
  divider: 'rgba(138,128,112,0.19)',
  chipMuted: 'rgba(138,128,112,0.31)',
}

const FONT = {
  display: '"JapanRamen", system-ui, sans-serif',
  body: '"GeistPixel-Line", system-ui, sans-serif',
}

function DecorativeDots({ size = 10, count = 7 }: { size?: number; count?: number }) {
  const pattern = [true, false, true, true, false, true, false]
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            backgroundColor: pattern[i % pattern.length] ? COLORS.coral : COLORS.muted,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: COLORS.muted, fontSize: '10px', fontFamily: FONT.body }}>--</span>
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: '10px',
          color: COLORS.muted,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
    </div>
  )
}

function StatBlock({
  value,
  label,
  color,
}: {
  value: number | string
  label: string
  color: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
      <span style={{ fontFamily: FONT.display, fontSize: '28px', color }}>{value}</span>
      <span style={{ fontFamily: FONT.body, fontSize: '11px', color: COLORS.muted, textTransform: 'uppercase' as const }}>
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: '2px', height: '28px', backgroundColor: COLORS.divider, flexShrink: 0 }} />
}

function Chip({ label, accent }: { label: string; accent: boolean }) {
  return (
    <span
      style={{
        padding: '6px 12px',
        border: `1px solid ${accent ? COLORS.coral : COLORS.chipMuted}`,
        color: accent ? COLORS.cream : COLORS.muted,
        fontFamily: FONT.body,
        fontSize: '10px',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  )
}

function SkillCard({ name, installs }: { name: string; installs: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        backgroundColor: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <span style={{ fontFamily: FONT.body, fontSize: '11px', color: COLORS.cream }}>{name}</span>
      <span style={{ fontFamily: FONT.body, fontSize: '10px', color: COLORS.muted }}>
        {installs.toLocaleString()} installs
      </span>
    </div>
  )
}

export function OGImageCard(props: OGImageCardProps) {
  const { name, title, blocksDiscovered, skillsMatched, completionPercent, traits, skills } = props

  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        backgroundColor: COLORS.bg,
        fontFamily: FONT.body,
        overflow: 'hidden',
      }}
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          padding: '40px 48px',
          gap: '40px',
        }}
      >
        <DecorativeDots size={10} count={7} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: COLORS.coral, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT.display, fontSize: '14px' }}>
            <span style={{ color: COLORS.cream }}>acting</span>
            <span style={{ color: COLORS.coral }}>as</span>
          </span>
        </div>

        {/* Name + title */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: '46px',
              color: COLORS.cream,
              textTransform: 'uppercase' as const,
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: '16px', color: COLORS.muted }}>{title}</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <StatBlock value={blocksDiscovered} label="Blocks" color={COLORS.cream} />
          <Divider />
          <StatBlock value={skillsMatched} label="Skills" color={COLORS.coral} />
          <Divider />
          <StatBlock value={`${completionPercent}%`} label="Complete" color={COLORS.cream} />
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          backgroundColor: COLORS.bgDark,
          borderLeft: `2px solid ${COLORS.border}`,
          padding: '40px 36px',
          gap: '28px',
          flexShrink: 0,
        }}
      >
        {/* Identity chips */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
          <SectionHeader label="Identity" />
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
            {traits.map((trait, i) => (
              <Chip key={i} label={trait} accent={i < 3} />
            ))}
          </div>
        </div>

        {/* Matched skills */}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
            <SectionHeader label="Matched Skills" />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {skills.map((skill, i) => (
                <SkillCard key={i} name={skill.name} installs={skill.installs} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom dots */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <DecorativeDots size={8} count={7} />
        </div>
      </div>
    </div>
  )
}
