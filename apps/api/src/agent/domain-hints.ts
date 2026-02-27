export interface DomainHint {
  name: string
  explore: string[]
  signals: string[]
  inferencePoints: string[]
  matchingHints: string[]
}

export const DOMAIN_HINTS: Record<string, DomainHint> = {
  engineering: {
    name: 'Engineering',
    explore: [
      'Architecture preferences (monolith vs microservices, build vs buy)',
      'Primary tech stack and why they chose it',
      'Testing philosophy and approach',
      'Code review style and what they look for',
      'DevOps involvement and deployment practices',
      'How they handle technical debt',
    ],
    signals: [
      'Seniority from how they talk about trade-offs',
      'Stack expertise from specific framework/tool mentions',
      'Backend vs frontend vs full-stack orientation',
      'Infrastructure and deployment awareness',
    ],
    inferencePoints: [
      '"Ship fast" → pragmatic, startup-oriented',
      '"Comprehensive testing" → quality-focused, systematic',
      '"Depends on the context" → senior, nuanced thinker',
      '"I just built it myself" → hands-on, DIY mentality',
    ],
    matchingHints: [
      'Match on specific frameworks: react, vue, angular, svelte',
      'Match on languages: typescript, python, rust, go',
      'Match on tools: docker, kubernetes, terraform, git-workflows',
      'Match on practices: testing, code-review, architecture',
    ],
  },
  design: {
    name: 'Design',
    explore: [
      'Design process (research-first vs intuition, tools used)',
      'Specialization (UI, UX, brand, systems, motion)',
      'How they handle feedback and critique',
      'Relationship with engineering teams',
      'Design system philosophy',
    ],
    signals: [
      'Tool mentions (Figma, Sketch, Framer, After Effects)',
      'Process vocabulary (user research, prototyping, design thinking)',
      'Visual vs systems thinking orientation',
    ],
    inferencePoints: [
      '"Pixel-perfect" → detail-oriented, craft-focused',
      '"User research first" → evidence-based, empathetic',
      '"Move fast and iterate" → pragmatic, shipping-oriented',
      '"Design systems" → systematic, scalable thinker',
    ],
    matchingHints: [
      'Match on tools: figma, sketch, design-systems',
      'Match on disciplines: ux-research, ui-design, motion-design',
      'Match on frameworks: design-thinking, accessibility',
    ],
  },
  product: {
    name: 'Product',
    explore: [
      'How they prioritize (frameworks, intuition, data)',
      'Stakeholder management approach',
      'Metrics they care about most',
      'How they handle competing priorities',
      'Discovery vs delivery balance',
    ],
    signals: [
      'Framework mentions (RICE, ICE, Jobs-to-be-Done)',
      'Data sophistication (A/B testing, cohort analysis)',
      'Communication patterns with engineering/design',
    ],
    inferencePoints: [
      '"Data-driven" → analytical, evidence-focused',
      '"Customer obsessed" → empathetic, user-centric',
      '"Ship and learn" → iterative, lean',
      '"Vision-led" → strategic, long-term thinker',
    ],
    matchingHints: [
      'Match on methods: product-strategy, roadmap-planning',
      'Match on tools: analytics, a-b-testing, user-research',
      'Match on frameworks: okrs, jobs-to-be-done, lean-product',
    ],
  },
  data: {
    name: 'Data & Analytics',
    explore: [
      'Primary tools and languages (SQL, Python, R, dbt)',
      'Analytics vs ML vs data engineering orientation',
      'How they communicate findings to non-technical stakeholders',
      'Data quality and governance approach',
      'Visualization and storytelling preferences',
    ],
    signals: [
      'Tool sophistication (Jupyter, Airflow, Spark, dbt)',
      'Statistical literacy from how they discuss findings',
      'Engineering vs analysis orientation',
    ],
    inferencePoints: [
      '"Let me check the data" → evidence-driven, rigorous',
      '"The story in the data" → communicator, business-oriented',
      '"Pipeline reliability" → engineering-minded, systematic',
    ],
    matchingHints: [
      'Match on tools: python-data, sql, dbt, spark',
      'Match on methods: machine-learning, statistical-analysis',
      'Match on platforms: snowflake, databricks, airflow',
    ],
  },
  marketing: {
    name: 'Marketing',
    explore: [
      'Specialization (growth, brand, content, performance, product marketing)',
      'Channels they focus on and why',
      'How they measure success',
      'Creative process and brand instincts',
      'Technical marketing skills (SEO, analytics, automation)',
    ],
    signals: [
      'Channel expertise from specific platform mentions',
      'Data sophistication from attribution/measurement talk',
      'Creative vs analytical orientation',
    ],
    inferencePoints: [
      '"Brand storytelling" → creative, long-term thinker',
      '"CAC and LTV" → performance-oriented, data-driven',
      '"Content-led growth" → patient, systematic',
    ],
    matchingHints: [
      'Match on channels: seo, social-media, email-marketing',
      'Match on tools: google-analytics, hubspot, marketing-automation',
      'Match on methods: growth-hacking, content-strategy, brand-building',
    ],
  },
  operations: {
    name: 'Operations',
    explore: [
      'What they optimize for (efficiency, reliability, scale)',
      'Process design philosophy',
      'Tools and systems they manage',
      'How they handle incidents and escalations',
      'Cross-functional coordination approach',
    ],
    signals: [
      'Systems thinking from how they describe processes',
      'Tool mentions (Jira, Linear, Notion, Slack workflows)',
      'Scale and complexity of what they manage',
    ],
    inferencePoints: [
      '"Automate everything" → efficiency-obsessed, systematic',
      '"People first, then process" → empathetic leader',
      '"Measure what matters" → data-driven, focused',
    ],
    matchingHints: [
      'Match on tools: project-management, automation, monitoring',
      'Match on methods: process-optimization, incident-management',
      'Match on frameworks: agile, lean-ops, devops-practices',
    ],
  },
}

export function getDomainHintsText(domains: string[]): string {
  const hints = domains
    .map((d) => DOMAIN_HINTS[d.toLowerCase()])
    .filter(Boolean)

  if (hints.length === 0) return ''

  return hints
    .map(
      (h) =>
        `## ${h.name} Domain Guidance\n` +
        `**Explore:** ${h.explore.join('; ')}\n` +
        `**Signals:** ${h.signals.join('; ')}\n` +
        `**Inference Points:** ${h.inferencePoints.join('; ')}\n` +
        `**Skill Matching:** ${h.matchingHints.join('; ')}`
    )
    .join('\n\n')
}
