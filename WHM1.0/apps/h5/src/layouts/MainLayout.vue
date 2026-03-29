<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppTabBar from '@/components/layout/AppTabBar.vue'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? 'Hello, my world'))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-[#f2f2f2]">
    <AppHeader :title="title" />
    <main class="flex-1 overflow-y-auto pb-4">
      <RouterView />
    </main>
    <AppTabBar />
  </div>
</template>

