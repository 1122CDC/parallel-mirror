<script setup lang="ts">
import { Search, PlusCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const router = useRouter()

function openScan() {
  router.push('/scan')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur"
  >
    <h1 class="text-base font-bold text-slate-800">{{ title }}</h1>
    <div class="flex items-center gap-4">
      <Search class="h-5 w-5 text-slate-500" />
      <button
        type="button"
        class="text-slate-500 transition hover:text-slate-900"
        aria-label="打开维度探测"
        @click="openScan"
      >
        <PlusCircle class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>

