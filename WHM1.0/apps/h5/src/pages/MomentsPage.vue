<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Camera,
  ChevronLeft,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Share2,
  X,
} from 'lucide-vue-next'
import BranchAvatar from '@/components/common/BranchAvatar.vue'
import { useAppStore } from '@/stores/app'
import type { BranchProfile } from '@/types/domain'

const router = useRouter()
const store = useAppStore()

const currentMomentId = ref<string | null>(null)
const commentText = ref('')
const sendingComment = ref(false)
const replyTimer = ref<number | null>(null)

const mainBranchId = computed(() => store.profile.mainBranchId ?? '')
const heroBranch = computed(() => store.getBranchById(mainBranchId.value) ?? store.branches[0] ?? null)
const selfName = computed(() => store.profile.name || '未命名用户')

const fallbackBranch: BranchProfile = {
  id: 'fallback',
  branchNumber: '000',
  name: '未命名分身',
  profession: '未设置',
  workplace: '未设置',
  world: '个人主线',
  icon: 'fingerprint',
  color: 'bg-slate-900',
  bio: '当前账号还没有创建任何分支。',
  cover: '',
  status: 'ready',
  timestamp: 0,
}

function branchOf(id: string) {
  return store.getBranchById(id) ?? heroBranch.value ?? fallbackBranch
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

function openCommentModal(momentId: string) {
  currentMomentId.value = momentId
  commentText.value = ''
  sendingComment.value = false
}

function closeCommentModal() {
  currentMomentId.value = null
  commentText.value = ''
  sendingComment.value = false
}

function sendComment() {
  const momentId = currentMomentId.value
  const text = commentText.value.trim()
  if (!momentId || !text) return

  const moment = store.moments.find((item) => item.id === momentId)
  if (!moment) return

  sendingComment.value = true
  store.addComment(momentId, selfName.value, text)

  const author = branchOf(moment.branchId)
  closeCommentModal()

  if (replyTimer.value !== null) {
    window.clearTimeout(replyTimer.value)
  }

  if (author.id === mainBranchId.value) return

  replyTimer.value = window.setTimeout(() => {
    void store
      .generateBranchReply(author.id, moment.content, text)
      .then((reply) => {
        store.addComment(momentId, author.name, `回复 ${selfName.value}: ${reply}`)
      })
      .catch(() => undefined)
    replyTimer.value = null
  }, 2000)
}

onBeforeUnmount(() => {
  if (replyTimer.value !== null) {
    window.clearTimeout(replyTimer.value)
  }
})
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-[#f2f2f2]">
    <header
      class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-[#f2f2f2] px-4"
    >
      <button
        type="button"
        class="flex items-center gap-1 text-slate-800"
        @click="router.push('/discover')"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>
      <span class="font-bold text-slate-800">朋友圈</span>
      <Camera class="h-6 w-6 text-slate-800" />
    </header>

    <main class="flex-1 overflow-y-auto pb-6">
      <section
        class="relative h-72 overflow-hidden bg-slate-900 bg-cover bg-center"
        :style="{
          backgroundImage: heroBranch?.cover
            ? `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.6)), url('${heroBranch.cover}')`
            : 'linear-gradient(180deg, rgba(15,23,42,1), rgba(51,65,85,1))',
        }"
      >
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_40%)]" />
        <div class="absolute bottom-4 right-4 flex items-end gap-4">
          <div class="text-right">
            <p class="text-lg font-bold text-white drop-shadow">{{ store.profile.name }}</p>
            <p v-if="!heroBranch" class="mt-1 text-xs text-white/70">当前账号还没有创建分支</p>
          </div>
          <div
            class="flex h-[70px] w-[70px] items-center justify-center rounded-2xl border-[3px] border-white bg-slate-800 text-2xl font-black text-white shadow-lg"
          >
            {{ selfName.slice(0, 1) || '未' }}
          </div>
        </div>
      </section>

      <section class="space-y-3 px-3 py-4">
        <div
          v-if="!store.momentCards.length"
          class="rounded-3xl bg-white p-4 text-sm leading-7 text-slate-500 shadow-sm ring-1 ring-slate-200"
        >
          当前账号还没有朋友圈内容。等你创建分支后，就可以在这里发布和互动了。
        </div>

        <article
          v-for="moment in store.momentCards"
          :key="moment.id"
          class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
        >
          <div class="flex items-center gap-3 p-4">
            <BranchAvatar :icon="branchOf(moment.branchId).icon" :color="branchOf(moment.branchId).color" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-bold text-slate-800">{{ branchOf(moment.branchId).name }}</span>
                <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {{ branchOf(moment.branchId).profession }}
                </span>
              </div>
              <div class="mt-1 flex items-center text-xs text-slate-400">
                <span>{{ formatTime(moment.timestamp) }}</span>
                <span class="mx-2 h-1 w-1 rounded-full bg-slate-300" />
                <span>{{ branchOf(moment.branchId).workplace }}</span>
              </div>
            </div>
            <i class="text-gray-300">
              <MoreHorizontal class="h-5 w-5" />
            </i>
          </div>

          <img
            v-if="moment.imageUrl"
            :src="moment.imageUrl"
            alt="moment image"
            class="max-h-[320px] w-full object-cover"
          />

          <div class="px-4 pb-4">
            <p class="text-[15px] leading-7 text-slate-800">{{ moment.content }}</p>

            <div class="mt-3 flex items-center gap-6 text-slate-400">
              <button
                type="button"
                class="flex items-center gap-1.5"
                @click="store.toggleLike(moment.id, selfName)"
              >
                <Heart
                  class="h-5 w-5"
                  :class="moment.likes.includes(selfName) ? 'fill-red-500 text-red-500' : ''"
                />
                <span class="text-xs font-bold">{{ moment.likes.length }}</span>
              </button>
              <button type="button" class="flex items-center gap-1.5" @click="openCommentModal(moment.id)">
                <MessageSquare class="h-5 w-5" />
                <span class="text-xs font-bold">{{ moment.comments.length }}</span>
              </button>
              <div class="flex-1" />
              <Share2 class="h-5 w-5" />
            </div>

            <div v-if="moment.likes.length || moment.comments.length" class="mt-3 rounded-2xl bg-slate-50 p-3">
              <p v-if="moment.likes.length" class="text-xs font-bold text-slate-500">
                {{ moment.likes.join('，') }}
              </p>
              <div
                v-for="comment in moment.comments"
                :key="`${moment.id}-${comment.userName}-${comment.text}`"
                class="mt-2 text-sm"
              >
                <span class="font-bold text-[#576b95]">{{ comment.userName }}:</span>
                <span class="text-slate-700">{{ comment.text }}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>

  <teleport to="body">
    <div
      v-if="currentMomentId"
      class="fixed inset-0 z-[300] flex items-end bg-black/50"
      @click.self="closeCommentModal"
    >
      <div class="w-full rounded-t-3xl bg-[#f7f7f7] p-4 shadow-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] text-slate-400">Comment</p>
            <h3 class="mt-1 text-lg font-black text-slate-800">回复评论</h3>
          </div>
          <button type="button" class="text-slate-400" @click="closeCommentModal">
            <X class="h-6 w-6" />
          </button>
        </div>

        <textarea
          v-model="commentText"
          class="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-[#07c160]"
          placeholder="写点什么..."
        ></textarea>

        <div class="mt-3 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-medium text-slate-500"
            @click="closeCommentModal"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-xl bg-[#07c160] px-6 py-2 text-sm font-bold text-white"
            :disabled="sendingComment"
            @click="sendComment"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

