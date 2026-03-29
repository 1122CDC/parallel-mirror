<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LockKeyhole, LogIn, Phone, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  phone: '',
  password: '',
})

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')

const redirectPath = computed(() => {
  const raw = route.query.redirect
  return typeof raw === 'string' && raw.trim() ? raw : '/chats'
})

async function submitAuth() {
  const phone = form.phone.trim()
  const password = form.password.trim()

  if (!phone || !password) {
    error.value = '请先填写手机号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'register') {
      await auth.register(phone, password)
    } else {
      await auth.login(phone, password)
    }

    await router.replace(redirectPath.value)
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : mode.value === 'register'
          ? '注册失败，请重试'
          : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

function switchMode(nextMode: 'login' | 'register') {
  mode.value = nextMode
  error.value = ''
}
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden bg-[#08111f] text-white">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(7,193,96,0.22),_transparent_38%),linear-gradient(180deg,#08111f_0%,#111827_58%,#0f172a_100%)]"
    />
    <div class="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-[#07c160]/20 blur-3xl" />
    <div class="absolute right-[-6rem] bottom-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

    <main class="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <section class="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07c160] text-white shadow-lg shadow-[#07c160]/30"
          >
            <Sparkles class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-white/45">Hello, my world</p>
            <h1 class="mt-1 text-2xl font-black">
              {{ mode === 'register' ? '创建你的独立世界' : '登录到 Hello, my world' }}
            </h1>
          </div>
        </div>

        <p class="mt-5 text-sm leading-7 text-white/70">
          {{ mode === 'register'
            ? '注册后只需要手机号和密码，就能创建一个全新的独立账号。分身、聊天、朋友圈和文件都会只属于你，不再继承旧模板。'
            : '登录后你会进入自己的独立世界，所有资料、分支、聊天和朋友圈都按账号隔离，不会和别人共用。' }}
        </p>

        <div class="mt-5 grid grid-cols-2 rounded-2xl bg-white/10 p-1 text-sm font-bold">
          <button
            type="button"
            class="rounded-xl px-4 py-2 transition"
            :class="mode === 'login'
              ? 'bg-[#07c160] text-white shadow-lg shadow-[#07c160]/20'
              : 'text-white/60'"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="rounded-xl px-4 py-2 transition"
            :class="mode === 'register'
              ? 'bg-[#07c160] text-white shadow-lg shadow-[#07c160]/20'
              : 'text-white/60'"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="submitAuth">
          <label class="block">
            <span class="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
              <Phone class="h-4 w-4" />
              手机号
            </span>
            <input
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              autocomplete="username"
              placeholder="请输入手机号"
              class="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#07c160] focus:bg-white/15"
            />
          </label>

          <label class="block">
            <span class="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
              <LockKeyhole class="h-4 w-4" />
              {{ mode === 'register' ? '设置密码' : '登录密码' }}
            </span>
            <input
              v-model="form.password"
              type="password"
              :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              placeholder="请输入密码"
              class="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#07c160] focus:bg-white/15"
            />
          </label>

          <div v-if="error" class="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ error }}
          </div>

          <button
            type="submit"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#07c160] font-bold text-white shadow-lg shadow-[#07c160]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="loading"
          >
            <LogIn class="h-4 w-4" />
            {{ loading
              ? (mode === 'register' ? '正在注册...' : '正在登录...')
              : (mode === 'register' ? '注册并进入' : '进入我的世界') }}
          </button>
        </form>

        <div
          class="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/65"
        >
          <ShieldCheck class="mt-0.5 h-5 w-5 shrink-0 text-[#07c160]" />
          <p v-if="mode === 'register'">
            注册只需要手机号和密码，不需要验证码或额外限制。新账号会自动拥有一个空白独立世界。
          </p>
          <p v-else>
            登录后系统会按账号隔离你的资料、分支、朋友圈和消息，确保每个用户都只看到自己的内容。
          </p>
        </div>
      </section>
    </main>
  </div>
</template>
