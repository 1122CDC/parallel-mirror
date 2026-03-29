<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, MoreHorizontal, Send } from 'lucide-vue-next'
import BranchAvatar from '@/components/common/BranchAvatar.vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const input = ref('')
const messageBox = ref<HTMLElement | null>(null)

const mainBranchId = computed(() => store.profile.mainBranchId ?? '')
const partnerId = computed(() => String(route.params.id ?? mainBranchId.value))
const partner = computed(() => {
  const direct = store.getBranchById(partnerId.value)
  if (direct) return direct

  if (mainBranchId.value) {
    return store.getBranchById(mainBranchId.value)
  }

  return null
})
const messages = computed(() =>
  partner.value ? store.getMessagesByPartnerId(partner.value.id) : [],
)

function scrollToBottom() {
  nextTick(() => {
    if (!messageBox.value) return
    messageBox.value.scrollTop = messageBox.value.scrollHeight
  })
}

function sendMessage() {
  const text = input.value.trim()
  if (!text || !partner.value) return

  store.sendMessage(partner.value.id, text)
  input.value = ''
  scrollToBottom()
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
  { immediate: true },
)

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-[#f2f2f2]">
    <header class="flex h-14 items-center justify-between border-b border-slate-200/80 bg-[#f2f2f2] px-4">
      <button type="button" class="flex items-center gap-1 text-slate-800" @click="router.push('/chats')">
        <ChevronLeft class="h-6 w-6" />
        <span class="font-bold">{{ partner?.name ?? '未命名用户' }}</span>
      </button>
      <MoreHorizontal class="h-6 w-6 text-slate-800" />
    </header>

    <main ref="messageBox" class="flex-1 overflow-y-auto px-4 py-4">
      <div v-if="partner" class="space-y-3">
        <div v-for="message in messages" :key="message.id" class="flex items-end gap-2" :class="message.isMe ? 'justify-end' : 'justify-start'">
          <BranchAvatar
            v-if="!message.isMe"
            :icon="partner.icon"
            :color="partner.color"
            size="sm"
          />
          <div
            class="max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm"
            :class="message.isMe ? 'bg-[#95ec69] text-slate-900' : 'bg-white text-slate-800'"
          >
            {{ message.text }}
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center"
      >
        <p class="text-lg font-black text-slate-800">当前账号还没有分支</p>
        <p class="text-sm leading-6 text-slate-500">
          新注册的账号现在是空白的，你可以先去创建一个分支，再回来聊天。
        </p>
        <button
          type="button"
          class="mt-2 rounded-xl bg-[#07c160] px-4 py-2 text-sm font-bold text-white"
          @click="router.push('/scan')"
        >
          去创建分支
        </button>
      </div>
    </main>

    <footer class="border-t border-slate-200 bg-[#f7f7f7] px-3 py-3 pb-[env(safe-area-inset-bottom)]">
      <div class="flex items-end gap-2">
        <textarea
          v-model="input"
          rows="1"
          class="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-[#07c160]"
          placeholder="输入..."
        ></textarea>
        <button
          type="button"
          class="flex h-11 items-center gap-1 rounded-xl bg-[#07c160] px-4 font-bold text-white"
          @click="sendMessage"
        >
          <Send class="h-4 w-4" />
          发送
        </button>
      </div>
    </footer>
  </div>
</template>

