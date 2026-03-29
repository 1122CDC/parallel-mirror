import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ChatsPage from '@/pages/ChatsPage.vue'
import ContactsPage from '@/pages/ContactsPage.vue'
import DiscoverPage from '@/pages/DiscoverPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import MePage from '@/pages/MePage.vue'
import MomentsPage from '@/pages/MomentsPage.vue'
import ScanPage from '@/pages/ScanPage.vue'
import ChatDetailPage from '@/pages/ChatDetailPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { title: '登录', public: true },
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'chats',
          name: 'chats',
          component: ChatsPage,
          meta: { title: 'Hello, my world', tab: 'chats' },
        },
        {
          path: 'contacts',
          name: 'contacts',
          component: ContactsPage,
          meta: { title: '通讯录', tab: 'contacts' },
        },
        {
          path: 'discover',
          name: 'discover',
          component: DiscoverPage,
          meta: { title: '发现', tab: 'discover' },
        },
        {
          path: 'me',
          name: 'me',
          component: MePage,
          meta: { title: '我', tab: 'me' },
        },
      ],
    },
    {
      path: '/chats/:id',
      name: 'chat-detail',
      component: ChatDetailPage,
      meta: { title: '聊天' },
    },
    {
      path: '/moments',
      name: 'moments',
      component: MomentsPage,
      meta: { title: '朋友圈' },
    },
    {
      path: '/scan',
      name: 'scan',
      component: ScanPage,
      meta: { title: '维度探测' },
    },
  ],
})

export default router

