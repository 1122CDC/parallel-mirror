<script setup lang="ts">
import { BookUser, Compass, MessageSquare, User } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const tabs = [
  { to: '/chats', label: '消息', icon: MessageSquare },
  { to: '/contacts', label: '通讯录', icon: BookUser },
  { to: '/discover', label: '发现', icon: Compass },
  { to: '/me', label: '我', icon: User },
]
</script>

<template>
  <nav class="shrink-0 border-t border-slate-200 bg-[#f7f7f7]/95 backdrop-blur">
    <div class="grid grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center gap-0.5 py-2 text-[11px] text-slate-500 transition"
        active-class="text-[#07c160]"
      >
        <component :is="tab.icon" class="h-6 w-6" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

