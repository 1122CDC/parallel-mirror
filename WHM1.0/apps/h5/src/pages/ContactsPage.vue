<script setup lang="ts">
import BranchAvatar from '@/components/common/BranchAvatar.vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
</script>

<template>
  <section class="space-y-3 p-3">
    <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p class="text-xs uppercase tracking-[0.25em] text-slate-400">Contacts</p>
      <h2 class="mt-2 text-xl font-black text-slate-800">通讯录先看分身列表</h2>
      <p class="mt-2 text-sm text-slate-500">
        后面这里会接后端接口，按用户、分身和权限做统一管理。
      </p>
    </div>

    <div v-if="store.branches.length" class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div
        v-for="branch in store.branches"
        :key="branch.id"
        class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
      >
        <BranchAvatar :icon="branch.icon" :color="branch.color" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate font-bold text-slate-800">{{ branch.name }}</span>
            <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {{ branch.status === 'ready' ? '已同步' : '同步中' }}
            </span>
          </div>
          <p class="mt-1 truncate text-xs text-slate-400">
            {{ branch.profession }} · {{ branch.workplace }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else
      class="rounded-3xl bg-white p-4 text-sm leading-7 text-slate-500 shadow-sm ring-1 ring-slate-200"
    >
      当前账号还没有任何分支。等你创建新的分支后，这里才会出现对应的联系人列表。
    </div>
  </section>
</template>

