import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { seedBranches, seedMessages, seedMoments, seedProfile } from '@/data/seed'
import {
  commentMoment as commentMomentApi,
  createBranch as createBranchApi,
  fetchBranches as fetchBranchesApi,
  fetchMessages as fetchMessagesApi,
  fetchMoments as fetchMomentsApi,
  fetchProfile as fetchProfileApi,
  generateReply as generateReplyApi,
  likeMoment as likeMomentApi,
  previewBranch as previewBranchApi,
  resetDevelopmentData as resetDevelopmentDataApi,
  sendMessage as sendMessageApi,
  updateProfile as updateProfileApi,
} from '@/services/api/appApi'
import type {
  AppTab,
  BranchPreview,
  BranchProfile,
  ChatMessage,
  MomentPost,
  UserProfile,
} from '@/types/domain'

const STORAGE_NAMESPACE = 'whm_h5_demo_v1'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function assignDefined(target: Record<string, unknown>, payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      target[key] = value
    }
  }
}

function nowId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

type AppSnapshot = {
  profile: UserProfile
  branches: BranchProfile[]
  messages: ChatMessage[]
  moments: MomentPost[]
}

function seedSnapshot(): AppSnapshot {
  return {
    profile: clone(seedProfile),
    branches: clone(seedBranches),
    messages: clone(seedMessages),
    moments: clone(seedMoments),
  }
}

function normalizeProfile(profile: Partial<UserProfile> | null | undefined): UserProfile {
  return {
    ...seedProfile,
    ...(profile ?? {}),
    mainBranchId: profile?.mainBranchId ?? undefined,
  }
}

export const useAppStore = defineStore('app', () => {
  const auth = useAuthStore()
  let mutationVersion = 0
  let activeStorageKey = ''

  const snapshot = seedSnapshot()
  const profile = reactive<UserProfile>(clone(snapshot.profile))
  const branches = ref<BranchProfile[]>(clone(snapshot.branches))
  const messages = ref<ChatMessage[]>(clone(snapshot.messages))
  const moments = ref<MomentPost[]>(clone(snapshot.moments))
  const activeTab = ref<AppTab>('chats')
  const sessionUserId = computed(() => (auth.isAuthenticated && auth.user?.id ? String(auth.user.id) : ''))

  function getStorageKey(userId: string | null | undefined) {
    return userId ? `${STORAGE_NAMESPACE}:${userId}` : ''
  }

  function applyProfileSnapshot(nextProfile: UserProfile) {
    profile.name = nextProfile.name
    profile.gender = nextProfile.gender
    profile.age = nextProfile.age
    profile.profession = nextProfile.profession
    profile.city = nextProfile.city
    profile.bio = nextProfile.bio

    if (nextProfile.mainBranchId === undefined) {
      delete (profile as Partial<UserProfile>).mainBranchId
    } else {
      profile.mainBranchId = nextProfile.mainBranchId
    }
  }

  function applySnapshot(next: AppSnapshot) {
    applyProfileSnapshot(next.profile)
    branches.value = clone(next.branches)
    messages.value = clone(next.messages)
    moments.value = clone(next.moments)
  }

  function save() {
    if (typeof window === 'undefined' || !activeStorageKey) return

    localStorage.setItem(
      activeStorageKey,
      JSON.stringify({
        profile,
        branches: branches.value,
        messages: messages.value,
        moments: moments.value,
      }),
    )
  }

  function markMutation() {
    mutationVersion += 1
  }

  function hydrateFromStorage(storageKey: string) {
    if (typeof window === 'undefined') return false

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return false

      const data = JSON.parse(raw) as {
        profile?: Partial<UserProfile>
        branches?: BranchProfile[]
        messages?: ChatMessage[]
        moments?: MomentPost[]
      }

      applySnapshot({
        profile: normalizeProfile(data.profile),
        branches: data.branches ? clone(data.branches) : [],
        messages: data.messages ? clone(data.messages) : [],
        moments: data.moments ? clone(data.moments) : [],
      })
      return true
    } catch {
      // 读取失败时回退到默认种子数据
      return false
    }
  }

  async function refreshFromServer() {
    if (!activeStorageKey) {
      return
    }

    const versionAtStart = mutationVersion

    try {
      const [remoteProfile, remoteBranches, remoteMoments] = await Promise.all([
        fetchProfileApi(),
        fetchBranchesApi(),
        fetchMomentsApi(),
      ])

      const cachedMessages = clone(messages.value)
      const remoteMessages = (
        await Promise.all(
          remoteBranches.map(async (branch) => {
            try {
              return await fetchMessagesApi(branch.id)
            } catch {
              return cachedMessages.filter((message) => message.partnerId === branch.id)
            }
          }),
        )
      ).flat()

      if (versionAtStart !== mutationVersion) {
        return
      }

      applySnapshot({
        profile: normalizeProfile(remoteProfile),
        branches: remoteBranches,
        messages: remoteMessages,
        moments: remoteMoments,
      })
      save()
    } catch {
      // 远程同步失败时保留本地缓存或种子数据
    }
  }

  async function resetAllData() {
    markMutation()

    try {
      await resetDevelopmentDataApi()
    } catch {
      // 后端失败时仍然保留前端重置
    }

    if (typeof window !== 'undefined') {
      if (activeStorageKey) {
        localStorage.removeItem(activeStorageKey)
      }
      localStorage.removeItem(STORAGE_NAMESPACE)
    }

    applySnapshot(seedSnapshot())
    activeTab.value = 'chats'
    save()
    void refreshFromServer()
  }

  watch(
    sessionUserId,
    (userId) => {
      markMutation()

      if (!userId) {
        activeStorageKey = ''
        applySnapshot(seedSnapshot())
        activeTab.value = 'chats'
        return
      }

      activeStorageKey = getStorageKey(userId)
      applySnapshot(seedSnapshot())
      hydrateFromStorage(activeStorageKey)
      void refreshFromServer()
    },
    { immediate: true },
  )

  const chatCards = computed(() =>
    [...branches.value]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((branch) => ({
        branch,
        lastMessage: getLatestMessage(branch.id),
      })),
  )

  const momentCards = computed(() =>
    [...moments.value].sort((a, b) => b.timestamp - a.timestamp),
  )

  function switchTab(tab: AppTab) {
    activeTab.value = tab
  }

  function getBranchById(id: string) {
    return branches.value.find((branch) => branch.id === id) ?? null
  }

  function getMessagesByPartnerId(partnerId: string) {
    return messages.value
      .filter((message) => message.partnerId === partnerId)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  function getLatestMessage(partnerId: string) {
    const list = getMessagesByPartnerId(partnerId)
    return list[list.length - 1] ?? null
  }

  function getMainBranchId() {
    return profile.mainBranchId ?? ''
  }

  async function updateProfile(payload: Partial<UserProfile>) {
    assignDefined(profile as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>)

    const mainBranch = getBranchById(getMainBranchId())
    if (mainBranch) {
      mainBranch.profession = profile.profession
      mainBranch.workplace = profile.city
      mainBranch.bio = profile.bio
    }

    markMutation()
    save()

    try {
      const remoteProfile = await updateProfileApi(payload)
      applyProfileSnapshot(normalizeProfile(remoteProfile))

      const remoteMainBranch = getBranchById(getMainBranchId())
      if (remoteMainBranch) {
        remoteMainBranch.profession = profile.profession
        remoteMainBranch.workplace = profile.city
        remoteMainBranch.bio = profile.bio
      }

      save()
    } catch {
      // 本地先保存，后端失败时不打断用户操作
    }
  }

  function sendMessage(partnerId: string, text: string) {
    const branch = getBranchById(partnerId)
    if (!branch) return

    const timestamp = Date.now()
    messages.value.push({
      id: nowId('msg'),
      partnerId,
      text,
      isMe: true,
      timestamp,
    })

    markMutation()
    save()

    void sendMessageApi(partnerId, text)
      .then((result) => {
        if (result.replyMessage) {
          messages.value.push(result.replyMessage)
          markMutation()
          save()
        }
      })
      .catch(() => undefined)
  }

  function toggleLike(momentId: string, userName = '未命名用户') {
    const moment = moments.value.find((item) => item.id === momentId)
    if (!moment) return

    if (moment.likes.includes(userName)) {
      moment.likes = moment.likes.filter((name) => name !== userName)
    } else {
      moment.likes.push(userName)
    }

    markMutation()
    save()
    void likeMomentApi(momentId, userName).catch(() => undefined)
  }

  function addComment(momentId: string, userName: string, text: string) {
    const moment = moments.value.find((item) => item.id === momentId)
    if (!moment) return

    moment.comments.push({ userName, text })
    markMutation()
    save()
    void commentMomentApi(momentId, userName, text).catch(() => undefined)
  }

  async function confirmBranchPreview(preview: BranchPreview) {
    const createdBranch = await createBranchApi(preview)

    if (!branches.value.some((branch) => branch.id === createdBranch.id)) {
      branches.value.push(createdBranch)
    }

    moments.value.unshift({
      id: nowId('mo'),
      branchId: createdBranch.id,
      content: `${createdBranch.name} 已完成同步，正在适应新的主线。`,
      imageUrl: null,
      timestamp: createdBranch.timestamp,
      likes: [],
      comments: [],
    })

    markMutation()
    activeTab.value = 'chats'
    save()
    void refreshFromServer()
    return getBranchById(createdBranch.id) ?? createdBranch
  }

  async function generateBranchPreview(year: string, description: string) {
    return await previewBranchApi(year, description)
  }

  async function generateBranchReply(branchId: string, momentContent: string, comment: string) {
    return await generateReplyApi(branchId, comment, momentContent)
  }

  return {
    activeTab,
    addComment,
    branches,
    chatCards,
    confirmBranchPreview,
    generateBranchPreview,
    generateBranchReply,
    getBranchById,
    getLatestMessage,
    getMessagesByPartnerId,
    messages,
    momentCards,
    moments,
    profile,
    resetAllData,
    sendMessage,
    switchTab,
    toggleLike,
    updateProfile,
  }
})
