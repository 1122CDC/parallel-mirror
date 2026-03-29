import type { BranchProfile, MomentPost } from '../types/domain'

const replyPools: Record<string, string[]> = {
  早餐店主: ['先把活干完，晚上再细聊。', '今天人多，先忙一阵。', '小本生意，得靠手脚快。'],
  骑手: ['单子一会儿就到，我先送完这单。', '路上风大，消息晚点回。', '今天跑得多，先歇口气。'],
  程序员: ['我这边先改一下，再回你。', '代码还在跑，稍等我一下。', '先把这版上线，晚点细说。'],
  医生: ['先把手头这位看完，我再回复。', '今天排班比较满，稍等一下。', '值班中，晚点再聊。'],
  职员: ['我先把事情处理完，再回你。', '手头有点忙，晚点说。', '收到，我这边先安排。'],
  default: ['收到，先忙一会儿。', '我看到了，晚点回你。', '先把眼前的事处理完。'],
}

function pickReply(author: BranchProfile, comment: string) {
  const normalized = comment.trim()
  const pool = replyPools[author.profession] ?? replyPools.default

  if (normalized.includes('谢谢')) return '不用客气，顺手的事。'
  if (normalized.includes('辛苦')) return '还好，慢慢来就行。'
  if (normalized.includes('加油')) return '嗯，我这边也继续顶着。'

  const index = Math.abs((author.id + normalized).length) % pool.length
  return pool[index]
}

export function buildBranchReply(author: BranchProfile, moment: MomentPost, comment: string) {
  void moment
  return pickReply(author, comment)
}
