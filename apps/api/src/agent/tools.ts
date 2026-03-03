import type { FunctionDeclaration } from '@google/genai'

export const identityTools: FunctionDeclaration[] = [
  {
    name: 'add_identity_block',
    description:
      'Record a discovered aspect of the user\'s professional identity. Call this 1-3 times per turn whenever you learn something concrete. Fire-and-forget — no response needed.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'personality_trait',
            'core_value',
            'domain_expertise',
            'communication_style',
            'decision_pattern',
            'tool_preference',
            'opinion',
            'anti_pattern',
            'working_style',
          ],
          description: 'Category of the identity block',
        },
        label: {
          type: 'string',
          description: 'Short display label, 2-4 words, e.g. "Pragmatic", "Ship-oriented"',
        },
        detail: {
          type: 'string',
          description: 'One sentence explaining WHY this is true about the user',
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'How confident you are about this block',
        },
        source_type: {
          type: 'string',
          enum: ['inferred', 'stated', 'confirmed'],
          description: 'Whether the user stated this directly or you inferred it',
        },
        related_domain: {
          type: 'string',
          description: 'Optional domain this block relates to',
        },
        display_priority: {
          type: 'number',
          description: 'Priority 1-10. 10 = defining trait.',
        },
      },
      required: ['category', 'label', 'detail', 'confidence', 'source_type'],
    },
  },
  {
    name: 'confirm_identity_block',
    description:
      'Lock in a tentative block after the user confirms it. Triggers visual solidification animation.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'The label of the block to confirm',
        },
        new_confidence: {
          type: 'string',
          enum: ['medium', 'high'],
          description: 'Updated confidence level',
        },
      },
      required: ['label', 'new_confidence'],
    },
  },
  {
    name: 'offer_quick_replies',
    description:
      'MANDATORY: Present tappable chip options alongside your question. You MUST call this tool every time you ask the user a question. Every question needs chips — even open-ended ones should have 3-4 suggested answers. Failing to call this tool when asking a question breaks the UI.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        chips: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Chip display text' },
              value: { type: 'string', description: 'Value sent when tapped' },
              emoji: { type: 'string', description: 'Optional emoji prefix' },
            },
            required: ['label', 'value'],
          },
          description: 'Array of chip options to show',
        },
        allow_custom: {
          type: 'boolean',
          description: 'Whether to show an "Other..." free-text option',
        },
        multi_select: {
          type: 'boolean',
          description: 'Whether multiple chips can be selected (for domain selection)',
        },
      },
      required: ['chips'],
    },
  },
  {
    name: 'signal_phase_transition',
    description:
      'Move the conversation to the next phase. Call this when the current phase objectives are met.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        completed_phase: {
          type: 'string',
          enum: ['domain_discovery', 'rapid_profiling', 'review'],
          description: 'The phase that just completed',
        },
        next_phase: {
          type: 'string',
          enum: ['rapid_profiling', 'review', 'published'],
          description: 'The phase to transition to',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of what was accomplished in the completed phase',
        },
      },
      required: ['completed_phase', 'next_phase', 'summary'],
    },
  },
  {
    name: 'match_skills',
    description:
      'Search the skills dataset for matching community skills. Call after domain selection, after learning specific tools/frameworks, and during the final review sweep. This is a REAL tool that returns actual search results.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query, e.g. "react state management", "laravel", "git workflows"',
        },
        domain: {
          type: 'string',
          description: 'Optional domain filter: engineering, design, product, data, marketing, operations',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 5, max 10)',
        },
      },
      required: ['query'],
    },
  },
]
