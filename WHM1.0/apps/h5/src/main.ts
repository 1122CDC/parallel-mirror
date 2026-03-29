import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()
const auth = useAuthStore(pinia)

function resolveRedirectTarget(raw: unknown) {
  return typeof raw === 'string' && raw.trim().startsWith('/') ? raw : '/chats'
}

router.beforeEach(async (to) => {
  await auth.bootstrap()

  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) {
      return resolveRedirectTarget(to.query.redirect)
    }

    return true
  }

  if (!auth.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  return true
})

app.use(pinia)
app.use(router)
app.mount('#app')
