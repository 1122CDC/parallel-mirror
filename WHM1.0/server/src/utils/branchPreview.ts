import type { BranchPreview, UserProfile } from '../types/domain'
import { callAiCompletion } from './aiClient'

interface BuildBranchPreviewParams {
  year: string
  description: string
  user: UserProfile
  branchNumber: string
}

function stripJsonCodeFences(text: string) {
  return text.replace(/```json/gi, '').replace(/```/gi, '').trim()
}

function readTextField(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildSystemInstruction(user: UserProfile, branchNumber: string) {
  return [
    'You are an AI that simulates parallel lives in Chinese society.',
    `The current account's main profile is: name [${user.name}], gender [${user.gender}], age [${user.age}], profession [${user.profession}], city [${user.city}], bio [${user.bio}].`,
    `Based on the divergence point, infer the life of branch No.${branchNumber}.`,
    'Keep the profession grounded, realistic, and specific.',
    'Estimate the age in the branch year and weave it naturally into the bio.',
    'Return JSON only with these fields: profession, workplace, icon, color, bio.',
    'Write all human-readable fields in Chinese.',
    'Example JSON: { "profession": "coffee-shop-owner", "workplace": "Downtown Coffee Shop", "icon": "store", "color": "bg-amber-500", "bio": "A grounded life story." }',
  ].join('\n')
}

function parsePreviewPayload(text: string, branchNumber: string): BranchPreview {
  const parsed = JSON.parse(stripJsonCodeFences(text)) as Record<string, unknown>
  const profession = readTextField(parsed.profession)
  const workplace = readTextField(parsed.workplace)
  const icon = readTextField(parsed.icon)
  const color = readTextField(parsed.color)
  const bio = readTextField(parsed.bio)

  if (!profession || !workplace || !icon || !color || !bio) {
    throw new Error('AI preview response is incomplete')
  }

  return {
    name: `No.${branchNumber}`,
    profession,
    workplace,
    icon,
    color,
    bio,
  }
}

export async function buildPreviewFromPrompt(params: BuildBranchPreviewParams): Promise<BranchPreview> {
  const systemInstruction = buildSystemInstruction(params.user, params.branchNumber)
  const prompt = `Branch year: ${params.year}. Decision: ${params.description}.`
  const text = await callAiCompletion({
    prompt,
    systemInstruction,
    isJson: true,
  })

  return {
    ...parsePreviewPayload(text, params.branchNumber),
    sourceYear: params.year,
    sourceDescription: params.description.trim(),
  }
}

export const buildBranchPreview = buildPreviewFromPrompt
