import type { BranchPreview, UserProfile } from '@/types/domain'

interface BuildBranchPreviewParams {
  year: string
  description: string
  user: UserProfile
  branchNumber: string
}

function pickPreset(description: string): Pick<BranchPreview, 'profession' | 'workplace' | 'icon' | 'color'> {
  const text = description.toLowerCase()

  if (text.includes('创业') || text.includes('开店') || text.includes('餐饮') || text.includes('烧烤')) {
    return {
      profession: '小老板',
      workplace: '本地生活小店',
      icon: 'store',
      color: 'bg-amber-500',
    }
  }

  if (text.includes('程序') || text.includes('代码') || text.includes('开发') || text.includes('it')) {
    return {
      profession: '程序员',
      workplace: '互联网公司',
      icon: 'laptop',
      color: 'bg-sky-500',
    }
  }

  if (text.includes('医生') || text.includes('医院') || text.includes('诊所')) {
    return {
      profession: '医生',
      workplace: '社区医院',
      icon: 'graduation-cap',
      color: 'bg-emerald-500',
    }
  }

  if (text.includes('骑手') || text.includes('外卖') || text.includes('跑单')) {
    return {
      profession: '骑手',
      workplace: '城市配送站',
      icon: 'bike',
      color: 'bg-green-500',
    }
  }

  return {
    profession: '职员',
    workplace: '普通工作单位',
    icon: 'user',
    color: 'bg-slate-700',
  }
}

export function buildBranchPreview(params: BuildBranchPreviewParams): BranchPreview {
  const preset = pickPreset(params.description)
  const summary = params.description.trim().replace(/\s+/g, ' ')
  const shortSummary = summary.slice(0, 18)

  return {
    name: `No.${params.branchNumber}`,
    profession: preset.profession,
    workplace: `${params.user.city}${params.year}·${preset.workplace}`,
    icon: preset.icon,
    color: preset.color,
    bio: `${params.user.name} 在 ${params.year} 年做了“${shortSummary || '关键选择'}”，于是走向了另一条更接地气的人生线。`,
    sourceYear: params.year,
    sourceDescription: params.description.trim(),
  }
}

