<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <section class="space-y-3 p-3">
    <div class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        class="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left active:bg-slate-50"
        @click="router.push('/moments')"
      >
        <div class="flex items-center gap-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <span class="text-lg">◉</span>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">朋友圈</p>
            <p class="mt-0.5 text-xs text-slate-400">查看分身们的动态</p>
          </div>
        </div>
        <span class="text-slate-300">›</span>
      </button>

      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-50"
        @click="router.push('/scan')"
      >
        <div class="flex items-center gap-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <span class="text-lg">◎</span>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">维度探测</p>
            <p class="mt-0.5 text-xs text-slate-400">先做分歧预演</p>
          </div>
        </div>
        <span class="text-slate-300">›</span>
      </button>
    </div>
  </section>
</template>

