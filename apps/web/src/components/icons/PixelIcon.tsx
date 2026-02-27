import {
  Terminal,
  Brush,
  Package,
  Chart,
  Megaphone,
  Zap,
  SettingsCog,
  Database,
  Globe,
  Heart,
  Sparkle,
  Gamepad,
  Shield,
  Users,
  Lightbulb,
  ToolCase,
  BookOpen,
  Camera,
  Send,
} from 'pixelarticons/react'
import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const KEYWORD_ICON_MAP: Record<string, IconComponent> = {
  engineering: Terminal,
  design: Brush,
  product: Package,
  'data & analytics': Chart,
  data: Chart,
  analytics: Chart,
  marketing: Megaphone,
  operations: Zap,
  settings: SettingsCog,
  code: Terminal,
  database: Database,
  web: Globe,
  health: Heart,
  favorite: Sparkle,
  gaming: Gamepad,
  security: Shield,
  team: Users,
  idea: Lightbulb,
  launch: Send,
  tools: ToolCase,
  education: BookOpen,
  media: Camera,
}

// Strip leading emoji from text and return [cleanText, matchedKeyword]
function stripEmoji(text: string): string {
  // Remove leading emoji characters (Unicode emoji ranges)
  return text.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, '').trim()
}

function findIconForText(text: string): IconComponent | null {
  const lower = text.toLowerCase()
  for (const [keyword, icon] of Object.entries(KEYWORD_ICON_MAP)) {
    if (lower.includes(keyword)) return icon
  }
  return null
}

interface PixelIconProps {
  text: string
  size?: number
  className?: string
}

export function PixelIcon({ text, size = 16, className = '' }: PixelIconProps) {
  const Icon = findIconForText(text)
  if (!Icon) return null
  return <Icon width={size} height={size} className={className} />
}

export function stripEmojiFromText(text: string): string {
  return stripEmoji(text)
}
