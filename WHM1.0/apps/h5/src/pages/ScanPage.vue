<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Radar } from 'lucide-vue-next'
import BranchAvatar from '@/components/common/BranchAvatar.vue'
import { useAppStore } from '@/stores/app'
import type { BranchPreview } from '@/types/domain'

const router = useRouter()
const store = useAppStore()
const form = reactive({
  year: '2012',
  description: '当年没考研，选择回老家创业开了个烧烤摊。',
})
const preview = ref<BranchPreview | null>(null)
const errorText = ref('')
const previewLoading = ref(false)
const confirmLoading = ref(false)

async function requestPreview() {
  const year = form.year.trim()
  const description = form.description.trim()

  if (!year || !description) {
    errorText.value = '请先填写年份和决策内容'
    preview.value = null
    return
  }

  errorText.value = ''
  preview.value = null
  previewLoading.value = true

  try {
    preview.value = await store.generateBranchPreview(year, description)
  } catch {
    errorText.value = '推演失败，请再试一次'
    preview.value = null
  } finally {
    previewLoading.value = false
  }
}

async function confirmBranch() {
  if (!preview.value) return

  confirmLoading.value = true
  errorText.value = ''
  try {
    await store.confirmBranchPreview(preview.value)
    router.push('/chats')
  } catch {
    errorText.value = '同步失败，请检查后端后再试'
  } finally {
    confirmLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-white">
    <header class="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
      <button type="button" class="text-slate-800" @click="router.push('/discover')">
        <ChevronLeft class="h-6 w-6" />
      </button>
      <span class="font-bold text-slate-800">维度探测</span>
    </header>

    <main class="flex-1 overflow-y-auto bg-white p-4">
      <section class="flex w-full flex-col gap-6">
        <div class="rounded-3xl bg-blue-50 p-5 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">
            <Radar class="h-8 w-8" />
          </div>
          <p class="mt-4 text-sm font-bold text-slate-500">输入分歧节点，调用后端 AI 推演</p>
        </div>

        <div class="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">年份</label>
            <input
              v-model="form.year"
              type="number"
              placeholder="例：2012"
              class="h-12 w-full rounded-2xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">决策内容</label>
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="例：当年没考研，选择回老家创业开了个烧烤摊..."
              class="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none transition focus:border-[#07c160]"
            ></textarea>
          </div>

          <button
            type="button"
            class="h-12 w-full rounded-2xl bg-[#07c160] font-bold text-white"
            :disabled="previewLoading"
            @click="requestPreview"
          >
            {{ previewLoading ? '生成中...' : '推演人生' }}
          </button>

          <p v-if="errorText" class="text-sm font-medium text-red-500">
            {{ errorText }}
          </p>
        </div>

        <div
          v-if="previewLoading"
          class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/20 px-6 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <div
            class="w-full max-w-[250px] rounded-[1.5rem] bg-white/95 p-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200"
          >
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#07c160]/10 text-[#07c160]">
              <div class="h-8 w-8 rounded-full border-[3px] border-[#07c160]/20 border-t-[#07c160] animate-spin" />
            </div>
            <p class="mt-4 text-base font-bold text-slate-800">AI 正在生成推荐</p>
            <p class="mt-1 text-xs leading-5 text-slate-500">
              请稍等，系统正在为你计算分支结果
            </p>
          </div>
        </div>

        <div v-else-if="preview" class="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div class="flex items-center gap-4">
            <BranchAvatar :icon="preview!.icon" :color="preview!.color" size="lg" />
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-black text-slate-800">{{ preview!.name }}</span>
                <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  推演中
                </span>
              </div>
              <p class="mt-1 text-xs font-bold text-slate-400">{{ preview!.workplace }}</p>
            </div>
          </div>

          <div class="h-px bg-slate-100" />
          <p class="text-sm leading-7 text-slate-600 italic">{{ preview!.bio }}</p>

          <div class="flex gap-3">
            <button type="button" class="h-12 flex-1 rounded-2xl bg-slate-100 font-bold text-slate-500" @click="router.push('/discover')">
              放弃
            </button>
            <button
              type="button"
              class="h-12 flex-[2] rounded-2xl bg-[#07c160] font-bold text-white"
              :disabled="confirmLoading"
              @click="confirmBranch"
            >
              {{ confirmLoading ? '同步中...' : '同步到维度' }}
            </button>
          </div>
        </div>

        <div class="rounded-3xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">
          这里会走后端 AI 接口，结果会结合你的主线资料、分歧年份和选择内容来生成。
        </div>
      </section>
    </main>
  </div>
</template>

