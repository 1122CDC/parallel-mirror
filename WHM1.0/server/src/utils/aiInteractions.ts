import type { BranchProfile, UserProfile } from '../types/domain'
import { callAiCompletion, callAiImage } from './aiClient'

type MomentDraft = {
  content: string
  imageUrl: string | null
}

type MomentDraftPayload = {
  moments?: Array<{
    content?: unknown
    hasImage?: unknown
    visualPrompt?: unknown
  }>
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function generateChatReply(author: BranchProfile, prompt: string) {
  const text = await callAiCompletion({
    prompt,
    systemInstruction: `你是[${author.name}] 职业[${author.profession}]。回复当前账号的主线评论。`,
    isJson: false,
  })

  const reply = text.trim()
  if (!reply) {
    throw new Error('AI chat reply is empty')
  }

  return reply
}

export async function generateMomentCommentReply(
  author: BranchProfile,
  momentContent: string,
  comment: string,
) {
  const text = await callAiCompletion({
    prompt: `我的动态：“${momentContent}”。评论：“${comment}”。回复他一句。`,
    systemInstruction: `你是[${author.name}]，职业[${author.profession}]，生活在中国的平行时空。你要回复当前账号的评论。写实接地气，15字内。`,
    isJson: false,
  })

  const reply = text.trim()
  if (!reply) {
    throw new Error('AI moment reply is empty')
  }

  return reply
}

export async function generateMomentDraft(
  user: UserProfile,
  branch: BranchProfile,
  topic: string,
): Promise<MomentDraft> {
  const text = await callAiCompletion({
    prompt: `你是[${branch.name}] 职业[${branch.profession}]。参考当前账号[${user.name}]的特征。生成1条烟火气朋友圈。主题：${topic}`,
    systemInstruction: `JSON：{ "moments": [{ "content": "动态文字", "hasImage": true, "visualPrompt": "High quality photography of a ${branch.profession} at ${branch.workplace}" }] }`,
    isJson: true,
  })

  const payload = JSON.parse(text) as MomentDraftPayload
  const firstMoment = payload.moments?.[0]
  const content = readText(firstMoment?.content)
  if (!content) {
    throw new Error('AI moment draft is empty')
  }

  let imageUrl: string | null = null
  const hasImage = Boolean(firstMoment?.hasImage)
  const visualPrompt = readText(firstMoment?.visualPrompt)
  if (hasImage && visualPrompt) {
    try {
      imageUrl = await callAiImage({ prompt: visualPrompt })
    } catch {
      imageUrl = null
    }
  }

  return {
    content,
    imageUrl,
  }
}
