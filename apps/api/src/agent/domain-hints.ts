export interface DomainHint {
  domain: string
  areasToExplore: string[]
  signalsToExtract: string[]
  artifactsToRequest: string[]
}

export const domainHints: Record<string, DomainHint> = {
  Engineering: {
    domain: 'Engineering',
    areasToExplore: [
      'Primary languages and why they prefer them',
      'Framework opinions — not just what, but WHY',
      'Architecture philosophy: monolith vs microservice, modular vs flat',
      'Testing philosophy: TDD? integration-first? what they skip and why',
      'Code review style: what they look for, what they ignore, feedback approach',
      'Technical debt tolerance: when they accept it, when they refuse',
      'Naming conventions and code organization patterns',
    ],
    signalsToExtract: [
      'Decision heuristics — "I always X because Y"',
      'Strong opinions — "I think X is harmful because..."',
      'Tradeoff patterns — "I\'d choose X over Y when..."',
      'Anti-patterns they reject — "I never do X because..."',
    ],
    artifactsToRequest: [
      'GitHub repos they\'re proud of',
      'Code reviews they\'ve written',
      'Technical blog posts or docs',
    ],
  },
  Design: {
    domain: 'Design',
    areasToExplore: [
      'Primary discipline: UI, UX, motion, brand, product design',
      'Tools and workflow preferences',
      'Process: wireframe-first, prototype-first, code-first',
      'Design system opinions: atomic design, tokens, component libraries',
      'Accessibility stance: compliance-driven or values-driven',
      'Visual style: minimalist, bold, playful, corporate',
    ],
    signalsToExtract: [
      'Aesthetic judgment patterns — "Good design is..."',
      'Process preferences — "I always start with..."',
      'Collaboration style with engineers',
      'Non-negotiable standards',
    ],
    artifactsToRequest: [
      'Portfolio pieces or case studies',
      'Figma files or design documentation',
      'Before/after redesigns',
    ],
  },
  Product: {
    domain: 'Product',
    areasToExplore: [
      'Prioritization framework: RICE, ICE, gut, data-driven',
      'How they write specs/PRDs',
      'Stakeholder management style',
      'Metrics philosophy: north star, leading/lagging',
      'Feature scoping: how they say no, how they cut scope',
      'Roadmap philosophy: fixed vs flexible',
    ],
    signalsToExtract: [
      'Prioritization heuristics',
      'Communication style with engineers vs leadership',
      'Handling competing priorities',
      'What makes a "good" product decision',
    ],
    artifactsToRequest: [
      'PRDs or specs they\'ve written',
      'Roadmap examples',
      'Strategy documents',
    ],
  },
  'Data / Analytics': {
    domain: 'Data / Analytics',
    areasToExplore: [
      'Tools: SQL, Python, R, BI tools',
      'Data modeling philosophy',
      'Statistical rigor vs speed tradeoffs',
      'Data storytelling approach',
      'Pipeline architecture preferences',
    ],
    signalsToExtract: [
      'How they balance rigor with speed',
      'Communication style for non-technical audiences',
      'What makes a "good" analysis',
    ],
    artifactsToRequest: [
      'Analysis notebooks or dashboards',
      'Data documentation or blog posts',
    ],
  },
  Marketing: {
    domain: 'Marketing',
    areasToExplore: [
      'Channels and specialization',
      'Copy and messaging philosophy',
      'Data-driven vs creative instinct balance',
      'Brand voice development approach',
    ],
    signalsToExtract: [
      'What makes messaging "work"',
      'How they measure success',
      'Creative process patterns',
    ],
    artifactsToRequest: [
      'Campaign examples or case studies',
      'Copy samples or brand guidelines',
    ],
  },
  Operations: {
    domain: 'Operations',
    areasToExplore: [
      'Process design philosophy',
      'Automation vs human judgment balance',
      'Scaling approach',
      'Cross-functional coordination style',
    ],
    signalsToExtract: [
      'Efficiency heuristics',
      'When they standardize vs customize',
      'How they handle exceptions',
    ],
    artifactsToRequest: [
      'Process documentation',
      'Workflow designs',
    ],
  },
}

export const generalHints = {
  personalityAndCommunication: [
    'Communication style: direct vs diplomatic, concise vs detailed',
    'How they handle disagreements or pushback',
    'Decision-making speed: deliberate vs fast',
    'Risk tolerance: conservative vs experimental',
    'Values hierarchy: quality vs speed vs learning vs impact',
  ],
  workingStyle: [
    'How they approach new problems',
    'Collaboration preferences: async vs sync, solo vs pair',
    'How they handle being wrong or making mistakes',
  ],
  metaObservation: [
    'Sentence structure and length (thinking style)',
    'Vocabulary complexity (communication preference)',
    'Use of qualifiers vs definitive statements',
    'Whether they think in systems, narratives, or data',
  ],
}
