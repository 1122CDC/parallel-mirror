<script setup lang="ts">
import { useRouter } from 'vue-router'
import BranchAvatar from '@/components/common/BranchAvatar.vue'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

function openChat(id: string) {
  router.push(`/chats/${id}`)
}
</script>

<template>
  <section class="space-y-3 p-3">
    <div class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        v-for="item in store.chatCards"
        :key="item.branch.id"
        type="button"
        class="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 active:bg-slate-50"
        @click="openChat(item.branch.id)"
      >
        <BranchAvatar :icon="item.branch.icon" :color="item.branch.color" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <span class="truncate font-bold text-slate-800">{{ item.branch.name }}</span>
            <span class="shrink-0 text-[11px] text-slate-400">
              {{ formatClock(item.lastMessage?.timestamp ?? item.branch.timestamp) }}
            </span>
          </div>
          <div class="mt-1 flex min-w-0 items-center gap-2">
            <span
              class="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
            >
              {{ item.branch.profession }}
            </span>
            <p class="truncate text-xs text-slate-400">
              {{ item.lastMessage?.text || '维度信号已锁定' }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <div
      v-if="!store.chatCards.length"
      class="rounded-3xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200"
    >
      还没有聊天，先去创建一个分身吧。
    </div>
  </section>
</template>

