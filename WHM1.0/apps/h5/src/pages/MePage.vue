<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const store = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const draft = reactive({ ...store.profile })

async function saveProfile() {
  await store.updateProfile({ ...draft })
}

async function resetAllData() {
  await store.resetAllData()
  Object.assign(draft, store.profile)
  router.push('/chats')
}

async function logout() {
  await auth.logout()
  router.replace('/login')
}
</script>

<template>
  <section class="space-y-3 p-3">
    <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div class="flex items-center gap-4">
        <div
          class="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-amber-400 bg-slate-900 text-3xl font-black text-white"
        >
          {{ draft.name.slice(0, 1) || '未' }}
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-2xl font-black text-slate-800">{{ draft.name }}</h2>
          <p class="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
            当前账号
          </p>
          <p class="mt-2 text-xs text-slate-500">
            手机号：{{ auth.user?.phone || '未登录' }}
          </p>
        </div>
      </div>
    </div>

    <form
      class="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      @submit.prevent="saveProfile"
    >
      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">姓名</label>
        <input
          v-model="draft.name"
          class="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
        />
      </div>

      <div class="grid gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">性别</label>
          <select
            v-model="draft.gender"
            class="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">年龄</label>
          <input
            v-model.number="draft.age"
            type="number"
            class="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
          />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">职业</label>
        <input
          v-model="draft.profession"
          class="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">城市</label>
        <input
          v-model="draft.city"
          class="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-[#07c160]"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">简介</label>
        <textarea
          v-model="draft.bio"
          class="min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none transition focus:border-[#07c160]"
        ></textarea>
      </div>

      <button
        type="submit"
        class="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white transition hover:opacity-90"
      >
        保存资料
      </button>
    </form>

    <button
      type="button"
      class="w-full rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-red-500 shadow-sm ring-1 ring-red-100"
      @click="resetAllData"
    >
      重置本地数据
    </button>

    <button
      type="button"
      class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-sm"
      @click="logout"
    >
      退出登录
    </button>
  </section>
</template>
