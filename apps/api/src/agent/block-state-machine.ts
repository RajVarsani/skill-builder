import type { IBlockState } from '../db/models/conversation'

export interface BlockDefinition {
  id: string
  category: string
  label: string
  phase: 'discovery' | 'deep' | 'review'
  required: boolean
  dependsOn?: string[]
  questionHint: string
  chipOptions?: string[]
}

const UNIVERSAL_BLOCKS: BlockDefinition[] = [
  {
    id: 'seniority',
    category: 'working_style',
    label: 'Seniority',
    phase: 'discovery',
    required: true,
    questionHint: 'What level best describes your current role?',
    chipOptions: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff', 'Principal'],
  },
  {
    id: 'core_value',
    category: 'core_value',
    label: 'Core Value',
    phase: 'discovery',
    required: true,
    questionHint: 'What matters most to you in your work?',
    chipOptions: ['Speed', 'Quality', 'Simplicity', 'Learning', 'Impact'],
  },
  {
    id: 'communication_style',
    category: 'communication_style',
    label: 'Communication Style',
    phase: 'deep',
    required: true,
    questionHint: 'How would you describe your communication approach?',
    chipOptions: ['Direct', 'Diplomatic', 'Casual', 'Formal'],
  },
  {
    id: 'risk_tolerance',
    category: 'decision_pattern',
    label: 'Risk Tolerance',
    phase: 'deep',
    required: true,
    questionHint: 'Present a scenario to infer risk tolerance from their decision pattern.',
  },
  {
    id: 'decision_heuristic',
    category: 'decision_pattern',
    label: 'Decision Heuristic',
    phase: 'deep',
    required: true,
    dependsOn: ['risk_tolerance'],
    questionHint: 'How do they typically make tough calls? Infer from scenario answers.',
  },
  {
    id: 'anti_pattern',
    category: 'anti_pattern',
    label: 'Anti-Pattern',
    phase: 'deep',
    required: false,
    questionHint: 'What do most people in your field do wrong?',
  },
  {
    id: 'hot_take',
    category: 'opinion',
    label: 'Hot Take',
    phase: 'deep',
    required: false,
    questionHint: 'What\'s your strongest professional opinion that others might disagree with?',
  },
  {
    id: 'superpower',
    category: 'personality_trait',
    label: 'Superpower',
    phase: 'review',
    required: false,
    questionHint: 'What\'s the one thing you\'re best at?',
  },
]

const DOMAIN_BLOCKS: Record<string, BlockDefinition[]> = {
  engineering: [
    {
      id: 'eng_approach',
      category: 'working_style',
      label: 'Build Approach',
      phase: 'discovery',
      required: true,
      questionHint: 'How do they approach building things?',
      chipOptions: ['Plan first', 'Prototype fast', 'Research deep', 'Jump in'],
    },
    {
      id: 'eng_primary_stack',
      category: 'tool_preference',
      label: 'Primary Stack',
      phase: 'deep',
      required: true,
      questionHint: 'What\'s their primary tech stack? This is crucial for skill matching.',
    },
    {
      id: 'eng_architecture',
      category: 'opinion',
      label: 'Architecture Preference',
      phase: 'deep',
      required: false,
      dependsOn: ['eng_primary_stack'],
      questionHint: 'Monolith or microservices? What\'s their philosophy?',
      chipOptions: ['Monolith', 'Microservices', 'Start mono, split later', 'Depends'],
    },
    {
      id: 'eng_testing',
      category: 'working_style',
      label: 'Testing Philosophy',
      phase: 'deep',
      required: false,
      questionHint: 'How do they feel about testing?',
      chipOptions: ['TDD zealot', 'Integration-first', 'Test critical paths', 'Tests slow me down'],
    },
    {
      id: 'eng_review_style',
      category: 'communication_style',
      label: 'Code Review Style',
      phase: 'deep',
      required: false,
      questionHint: 'How do they approach code reviews?',
      chipOptions: ['Approve with notes', 'Request changes', 'Pair on it', 'Rewrite it'],
    },
  ],
  design: [
    {
      id: 'design_process',
      category: 'working_style',
      label: 'Design Process',
      phase: 'discovery',
      required: true,
      questionHint: 'What drives their design process?',
      chipOptions: ['Research first', 'Intuition', 'Data-driven', 'Collaborative'],
    },
    {
      id: 'design_specialty',
      category: 'domain_expertise',
      label: 'Design Specialty',
      phase: 'deep',
      required: true,
      questionHint: 'What\'s their primary design discipline?',
      chipOptions: ['UI Design', 'UX Research', 'Brand', 'Systems', 'Motion'],
    },
    {
      id: 'design_tools',
      category: 'tool_preference',
      label: 'Design Tools',
      phase: 'deep',
      required: true,
      questionHint: 'What tools do they use daily?',
    },
  ],
  product: [
    {
      id: 'product_prioritization',
      category: 'decision_pattern',
      label: 'Prioritization Style',
      phase: 'discovery',
      required: true,
      questionHint: 'How do they prioritize work?',
      chipOptions: ['Data/metrics', 'Customer feedback', 'Vision/intuition', 'Frameworks (RICE, ICE)'],
    },
    {
      id: 'product_orientation',
      category: 'working_style',
      label: 'Product Orientation',
      phase: 'deep',
      required: true,
      questionHint: 'Discovery vs delivery — where do they spend most time?',
      chipOptions: ['Discovery-heavy', 'Delivery-focused', 'Balanced', 'Depends on phase'],
    },
  ],
  data: [
    {
      id: 'data_orientation',
      category: 'working_style',
      label: 'Data Orientation',
      phase: 'discovery',
      required: true,
      questionHint: 'Are they analytics, ML, or data engineering focused?',
      chipOptions: ['Analytics', 'Machine Learning', 'Data Engineering', 'Full stack data'],
    },
    {
      id: 'data_tools',
      category: 'tool_preference',
      label: 'Data Stack',
      phase: 'deep',
      required: true,
      questionHint: 'What\'s their primary data stack? SQL, Python, R, dbt?',
    },
  ],
  marketing: [
    {
      id: 'marketing_specialty',
      category: 'domain_expertise',
      label: 'Marketing Specialty',
      phase: 'discovery',
      required: true,
      questionHint: 'What area of marketing?',
      chipOptions: ['Growth', 'Brand', 'Content', 'Performance', 'Product Marketing'],
    },
    {
      id: 'marketing_channels',
      category: 'tool_preference',
      label: 'Key Channels',
      phase: 'deep',
      required: true,
      questionHint: 'Which channels do they focus on?',
    },
  ],
  operations: [
    {
      id: 'ops_focus',
      category: 'working_style',
      label: 'Operations Focus',
      phase: 'discovery',
      required: true,
      questionHint: 'What do they optimize for?',
      chipOptions: ['Efficiency', 'Reliability', 'Scale', 'People'],
    },
    {
      id: 'ops_tools',
      category: 'tool_preference',
      label: 'Operations Tools',
      phase: 'deep',
      required: true,
      questionHint: 'What tools and systems do they manage?',
    },
  ],
}

export class BlockStateMachine {
  private definitions: BlockDefinition[]
  private filledBlocks: Map<string, IBlockState>

  constructor(domains: string[], existingBlocks: IBlockState[] = []) {
    this.definitions = [
      ...UNIVERSAL_BLOCKS,
      ...domains.flatMap((d) => DOMAIN_BLOCKS[d.toLowerCase()] || []),
    ]
    this.filledBlocks = new Map()
    for (const block of existingBlocks) {
      this.filledBlocks.set(block.blockId, block)
    }
  }

  addBlock(block: IBlockState): void {
    this.filledBlocks.set(block.blockId, block)
  }

  confirmBlock(label: string, newConfidence: 'medium' | 'high'): IBlockState | null {
    for (const [, block] of this.filledBlocks) {
      if (block.label.toLowerCase() === label.toLowerCase()) {
        block.status = 'confirmed'
        block.confidence = newConfidence
        return block
      }
    }
    return null
  }

  getNextTargets(count: number = 3): BlockDefinition[] {
    const unfilled = this.definitions.filter((def) => {
      if (this.filledBlocks.has(def.id)) return false
      if (def.dependsOn?.some((dep) => !this.filledBlocks.has(dep))) return false
      return true
    })

    const prioritized = unfilled.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1
      const phaseOrder = { discovery: 0, deep: 1, review: 2 }
      return phaseOrder[a.phase] - phaseOrder[b.phase]
    })

    return prioritized.slice(0, count)
  }

  getCompletion(): { percentage: number; filled: number; total: number } {
    const required = this.definitions.filter((d) => d.required)
    const filledRequired = required.filter((d) => this.filledBlocks.has(d.id))
    const totalFilled = this.filledBlocks.size
    const totalDefs = this.definitions.length

    const base = 15
    const remaining = 85
    const progress = totalDefs > 0 ? (totalFilled / totalDefs) * remaining : 0

    return {
      percentage: Math.min(100, Math.round(base + progress)),
      filled: totalFilled,
      total: totalDefs,
    }
  }

  getBlockStateContext(): string {
    const filled = Array.from(this.filledBlocks.values())
    const targets = this.getNextTargets(3)
    const completion = this.getCompletion()

    let context = `## Current Block State (${completion.percentage}% complete, ${completion.filled}/${completion.total} blocks)\n\n`

    if (filled.length > 0) {
      context += '### Filled Blocks (do not re-ask these)\n'
      for (const block of filled) {
        context += `- **${block.label}** [${block.status}/${block.confidence}]: ${block.detail}\n`
      }
      context += '\n'
    }

    if (targets.length > 0) {
      context += '### Next Target Blocks\n'
      for (const target of targets) {
        context += `- **${target.label}** (${target.category}): ${target.questionHint}`
        if (target.chipOptions) {
          context += ` → Chips: [${target.chipOptions.join(', ')}]`
        }
        context += '\n'
      }
    }

    return context
  }
}
