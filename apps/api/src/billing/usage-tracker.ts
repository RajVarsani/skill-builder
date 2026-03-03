import { UsageLog } from '../db/models/usage-log'
import type { Types } from 'mongoose'

const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.1-pro-preview': { input: 2.00 / 1_000_000, output: 12.00 / 1_000_000 },
  'gemini-3-flash-preview': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gemini-2.5-flash': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gemini-2.0-flash': { input: 0.10 / 1_000_000, output: 0.40 / 1_000_000 },
}

const DEFAULT_PRICING = { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 }

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? DEFAULT_PRICING
  return inputTokens * pricing.input + outputTokens * pricing.output
}

export async function recordUsage(params: {
  conversationId?: string | Types.ObjectId | null
  userId?: string | Types.ObjectId | null
  source: 'conversation' | 'skill_generation'
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<void> {
  const costUsd = calculateCost(params.model, params.inputTokens, params.outputTokens)
  await UsageLog.create({
    conversationId: params.conversationId ?? null,
    userId: params.userId ?? null,
    source: params.source,
    modelId: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    costUsd,
  })
}

export async function getGlobalSpend(): Promise<number> {
  const result = await UsageLog.aggregate([
    { $group: { _id: null, total: { $sum: '$costUsd' } } },
  ])
  return result[0]?.total ?? 0
}

export async function checkSpendingLimit(): Promise<{
  allowed: boolean
  totalSpent: number
  limit: number
}> {
  const limit = Number(process.env.SPENDING_LIMIT_USD) || 50
  const totalSpent = await getGlobalSpend()
  return { allowed: totalSpent < limit, totalSpent, limit }
}

export async function getUsageStats(): Promise<{
  totalSpentUsd: number
  limitUsd: number
  remainingUsd: number
  totalCalls: number
  bySource: Record<string, { calls: number; costUsd: number; inputTokens: number; outputTokens: number }>
}> {
  const limit = Number(process.env.SPENDING_LIMIT_USD) || 50

  const result = await UsageLog.aggregate([
    {
      $group: {
        _id: '$source',
        calls: { $sum: 1 },
        costUsd: { $sum: '$costUsd' },
        inputTokens: { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      },
    },
  ])

  const bySource: Record<string, { calls: number; costUsd: number; inputTokens: number; outputTokens: number }> = {}
  let totalSpentUsd = 0
  let totalCalls = 0

  for (const row of result) {
    bySource[row._id] = {
      calls: row.calls,
      costUsd: Math.round(row.costUsd * 100) / 100,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
    }
    totalSpentUsd += row.costUsd
    totalCalls += row.calls
  }

  return {
    totalSpentUsd: Math.round(totalSpentUsd * 100) / 100,
    limitUsd: limit,
    remainingUsd: Math.round(Math.max(0, limit - totalSpentUsd) * 100) / 100,
    totalCalls,
    bySource,
  }
}
