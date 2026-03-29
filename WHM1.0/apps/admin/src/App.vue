<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search, SwitchButton } from '@element-plus/icons-vue'
import {
  fetchAdminBranchDetail,
  fetchAdminBranches,
  fetchAdminMe,
  fetchAdminStats,
  fetchAdminUserDetail,
  fetchAdminUsers,
  loginAdmin,
  logoutAdmin,
} from '@/services/adminApi'
import type {
  AdminAccount,
  AdminBranch,
  AdminBranchDetail,
  AdminBranchListItem,
  AdminStats,
  AdminUserDetail,
  AdminUserSummary,
} from '@/types'

const TOKEN_KEY = 'whm_admin_token'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

const authStatus = ref<AuthStatus>('loading')
const admin = ref<AdminAccount | null>(null)
const loginLoading = ref(false)
const loginError = ref('')
const refreshLoading = ref(false)

const stats = ref<AdminStats | null>(null)
const statsLoading = ref(false)
const statsError = ref('')

const userList = ref<AdminUserSummary[]>([])
const userTotal = ref(0)
const userListLoading = ref(false)
const userListError = ref('')

const branchList = ref<AdminBranchListItem[]>([])
const branchTotal = ref(0)
const branchListLoading = ref(false)
const branchListError = ref('')

const selectedUserId = ref('')
const selectedUser = ref<AdminUserDetail | null>(null)
const selectedUserLoading = ref(false)
const selectedUserError = ref('')
const userDrawerVisible = ref(false)
const activeUserTab = ref<'branches' | 'moments' | 'messages' | 'files' | 'jobs'>('branches')

const selectedBranchId = ref('')
const selectedBranch = ref<AdminBranchDetail | null>(null)
const selectedBranchLoading = ref(false)
const selectedBranchError = ref('')
const branchDrawerVisible = ref(false)
const activeBranchTab = ref<'moments' | 'messages'>('moments')

const activeMainTab = ref<'users' | 'branches'>('users')

const userQuery = reactive({
  q: '',
  status: 'all',
  page: 1,
  pageSize: 10,
})

const branchQuery = reactive({
  q: '',
  status: 'all',
  userId: '',
  page: 1,
  pageSize: 10,
})

const loginForm = reactive({
  username: 'admin',
  password: 'admin123456',
})

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'active' },
  { label: '已同步', value: 'ready' },
  { label: '同步中', value: 'syncing' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '停用', value: 'inactive' },
]

const pageSizeOptions = [10, 20, 50]

const branchRowKey = (row: AdminBranchListItem) => row.branch.id

function readStoredToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

function persistToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

function formatTime(value: number | null | undefined) {
  if (!value) return '暂无'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatDay(value: number | null | undefined) {
  if (!value) return '暂无'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function truncateText(value: string, length = 80) {
  const text = value.trim()
  return text.length <= length ? text : `${text.slice(0, length)}…`
}

function safeText(value: string | null | undefined, fallback = '暂无') {
  const text = value?.trim()
  return text ? text : fallback
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function statusLabel(value: string) {
  const map: Record<string, string> = {
    active: '启用',
    inactive: '停用',
    ready: '已同步',
    syncing: '同步中',
    loading: '加载中',
    processing: '处理中',
    completed: '已完成',
    success: '成功',
    failed: '失败',
    authenticated: '已登录',
    idle: '空闲',
  }

  return map[value] ?? value
}

function statusTagType(value: string) {
  if (['active', 'ready', 'completed', 'success', 'authenticated'].includes(value)) {
    return 'success'
  }

  if (['syncing', 'loading', 'processing'].includes(value)) {
    return 'warning'
  }

  if (['inactive', 'failed'].includes(value)) {
    return 'danger'
  }

  return 'info'
}

function userDisplayName(user: Pick<AdminUserSummary, 'nickname'> & { profile?: { name: string } | null } | null) {
  return user?.nickname?.trim() || user?.profile?.name?.trim() || '未命名用户'
}

function userInitial(name: string) {
  const text = name.trim()
  return text ? text.slice(0, 1).toUpperCase() : 'U'
}

function branchDisplayName(branch: Pick<AdminBranch, 'name'> | null) {
  return branch?.name?.trim() || '未命名支线'
}

function resetUserDetail() {
  selectedUserId.value = ''
  selectedUser.value = null
  selectedUserError.value = ''
  userDrawerVisible.value = false
}

function resetBranchDetail() {
  selectedBranchId.value = ''
  selectedBranch.value = null
  selectedBranchError.value = ''
  branchDrawerVisible.value = false
}

function clearDashboardState() {
  stats.value = null
  statsError.value = ''
  userList.value = []
  userTotal.value = 0
  userListError.value = ''
  branchList.value = []
  branchTotal.value = 0
  branchListError.value = ''
  resetUserDetail()
  resetBranchDetail()
}

const summaryCards = computed(() => [
  { label: '用户总数', value: stats.value?.userCount ?? 0, note: '已接入账户' },
  { label: '支线总数', value: stats.value?.branchCount ?? 0, note: '全部角色分支' },
  { label: '动态总数', value: stats.value?.momentCount ?? 0, note: '角色内容' },
  { label: '消息总数', value: stats.value?.messageCount ?? 0, note: '聊天记录' },
  { label: '文件总数', value: stats.value?.fileCount ?? 0, note: '素材归档' },
  { label: 'AI 任务', value: stats.value?.aiJobCount ?? 0, note: '推演记录' },
])

const userDrawerTitle = computed(() => {
  const detail = selectedUser.value
  return `用户详情 · ${detail ? userDisplayName(detail.user) : '未选择用户'}`
})

const branchDrawerTitle = computed(() => {
  const detail = selectedBranch.value
  return `支线详情 · ${detail ? branchDisplayName(detail.branch) : '未选择支线'}`
})

const selectedUserBranches = computed(() => selectedUser.value?.branches ?? [])
const selectedUserMoments = computed(() => selectedUser.value?.moments ?? [])
const selectedUserMessages = computed(() => selectedUser.value?.messages ?? [])
const selectedUserFiles = computed(() => selectedUser.value?.files ?? [])
const selectedUserJobs = computed(() => selectedUser.value?.aiJobs ?? [])

const selectedBranchMoments = computed(() => selectedBranch.value?.moments ?? [])
const selectedBranchMessages = computed(() => selectedBranch.value?.messages ?? [])

async function loadStats() {
  statsLoading.value = true
  statsError.value = ''

  try {
    stats.value = await fetchAdminStats()
    return stats.value
  } catch (error) {
    stats.value = null
    statsError.value = toErrorMessage(error, '后台统计加载失败，请检查后端是否正常运行')
    return null
  } finally {
    statsLoading.value = false
  }
}

async function loadUsers() {
  userListLoading.value = true
  userListError.value = ''

  try {
    const payload = await fetchAdminUsers({
      q: userQuery.q.trim(),
      status: userQuery.status,
      page: userQuery.page,
      pageSize: userQuery.pageSize,
    })

    userList.value = payload.items
    userTotal.value = payload.total
    return payload.items
  } catch (error) {
    userList.value = []
    userTotal.value = 0
    userListError.value = toErrorMessage(error, '用户列表加载失败')
    return []
  } finally {
    userListLoading.value = false
  }
}

async function loadBranches() {
  branchListLoading.value = true
  branchListError.value = ''

  try {
    const payload = await fetchAdminBranches({
      q: branchQuery.q.trim(),
      status: branchQuery.status,
      userId: branchQuery.userId.trim(),
      page: branchQuery.page,
      pageSize: branchQuery.pageSize,
    })

    branchList.value = payload.items
    branchTotal.value = payload.total
    return payload.items
  } catch (error) {
    branchList.value = []
    branchTotal.value = 0
    branchListError.value = toErrorMessage(error, '支线列表加载失败')
    return []
  } finally {
    branchListLoading.value = false
  }
}

async function openUserDetail(userId: string) {
  selectedUserId.value = userId
  userDrawerVisible.value = true
  selectedUserLoading.value = true
  selectedUserError.value = ''
  activeUserTab.value = 'branches'

  try {
    selectedUser.value = await fetchAdminUserDetail(userId)
  } catch (error) {
    selectedUser.value = null
    selectedUserError.value = toErrorMessage(error, '用户详情加载失败')
  } finally {
    selectedUserLoading.value = false
  }
}

async function openBranchDetail(branchId: string) {
  selectedBranchId.value = branchId
  branchDrawerVisible.value = true
  selectedBranchLoading.value = true
  selectedBranchError.value = ''
  activeBranchTab.value = 'moments'

  try {
    selectedBranch.value = await fetchAdminBranchDetail(branchId)
  } catch (error) {
    selectedBranch.value = null
    selectedBranchError.value = toErrorMessage(error, '支线详情加载失败')
  } finally {
    selectedBranchLoading.value = false
  }
}

async function refreshDashboard() {
  refreshLoading.value = true

  try {
    await Promise.all([loadStats(), loadUsers(), loadBranches()])

    if (selectedUserId.value && userList.value.some((item) => item.id === selectedUserId.value)) {
      await openUserDetail(selectedUserId.value)
    } else if (userList.value[0]) {
      await openUserDetail(userList.value[0].id)
    } else {
      resetUserDetail()
    }

    if (selectedBranchId.value && branchList.value.some((item) => item.branch.id === selectedBranchId.value)) {
      await openBranchDetail(selectedBranchId.value)
    }
  } finally {
    refreshLoading.value = false
  }
}

async function bootstrap() {
  const token = readStoredToken()

  if (!token) {
    authStatus.value = 'anonymous'
    clearDashboardState()
    return false
  }

  authStatus.value = 'loading'

  try {
    const payload = await fetchAdminMe()
    admin.value = payload.admin
    authStatus.value = 'authenticated'
    await refreshDashboard()
    return true
  } catch {
    clearSession()
    admin.value = null
    authStatus.value = 'anonymous'
    clearDashboardState()
    return false
  }
}

async function submitLogin() {
  const username = loginForm.username.trim()
  const password = loginForm.password.trim()

  if (!username || !password) {
    loginError.value = '请先填写管理员账号和密码'
    return
  }

  loginLoading.value = true
  loginError.value = ''

  try {
    const payload = await loginAdmin(username, password)
    persistToken(payload.token)
    admin.value = payload.admin
    authStatus.value = 'authenticated'
    ElMessage.success('登录成功')
    await refreshDashboard()
  } catch (error) {
    loginError.value = toErrorMessage(error, '管理员登录失败，请重试')
  } finally {
    loginLoading.value = false
  }
}

async function handleLogout() {
  try {
    await logoutAdmin()
  } catch {
    // 只要本地清理掉 token 就算退出成功。
  } finally {
    clearSession()
    admin.value = null
    authStatus.value = 'anonymous'
    clearDashboardState()
    ElMessage.success('已退出后台')
  }
}

async function handleRefresh() {
  await refreshDashboard()
}

async function handleUserSearch() {
  userQuery.page = 1
  const items = await loadUsers()

  if (!items.length) {
    resetUserDetail()
    return
  }

  const targetId =
    selectedUserId.value && items.some((item) => item.id === selectedUserId.value)
      ? selectedUserId.value
      : items[0].id

  await openUserDetail(targetId)
}

async function handleUserReset() {
  userQuery.q = ''
  userQuery.status = 'all'
  userQuery.page = 1
  userQuery.pageSize = 10
  await handleUserSearch()
}

async function handleUserPageChange(page: number) {
  userQuery.page = page
  await handleUserSearch()
}

async function handleUserPageSizeChange(size: number) {
  userQuery.pageSize = size
  userQuery.page = 1
  await handleUserSearch()
}

async function handleBranchSearch() {
  branchQuery.page = 1
  await loadBranches()
}

async function handleBranchReset() {
  branchQuery.q = ''
  branchQuery.status = 'all'
  branchQuery.userId = ''
  branchQuery.page = 1
  branchQuery.pageSize = 10
  await handleBranchSearch()
}

async function handleBranchPageChange(page: number) {
  branchQuery.page = page
  await handleBranchSearch()
}

async function handleBranchPageSizeChange(size: number) {
  branchQuery.pageSize = size
  branchQuery.page = 1
  await handleBranchSearch()
}

async function handleUserRowClick(row: AdminUserSummary) {
  activeMainTab.value = 'users'
  await openUserDetail(row.id)
}

async function handleBranchRowClick(row: AdminBranchListItem) {
  activeMainTab.value = 'branches'
  await openBranchDetail(row.branch.id)
}

async function refreshSelectedUser() {
  if (selectedUserId.value) {
    await openUserDetail(selectedUserId.value)
  }
}

async function refreshSelectedBranch() {
  if (selectedBranchId.value) {
    await openBranchDetail(selectedBranchId.value)
  }
}

async function showSelectedUserBranches() {
  if (!selectedUser.value) return

  branchQuery.userId = selectedUser.value.user.id
  branchQuery.page = 1
  activeMainTab.value = 'branches'
  await handleBranchSearch()
}

async function showBranchesForUser(userId: string) {
  branchQuery.userId = userId
  branchQuery.page = 1
  activeMainTab.value = 'branches'
  await handleBranchSearch()
}

async function showBranchOwner() {
  if (!selectedBranch.value) return

  activeMainTab.value = 'users'
  await openUserDetail(selectedBranch.value.user.id)
}

onMounted(() => {
  void bootstrap()
})
</script>

<template>
  <div class="admin-page">
    <section v-if="authStatus === 'loading'" class="admin-login-shell">
      <el-card class="admin-login-card" shadow="never">
        <el-skeleton :rows="6" animated />
        <p class="admin-login-hint">正在检查管理员身份并载入后台数据...</p>
      </el-card>
    </section>

    <section v-else-if="authStatus !== 'authenticated'" class="admin-login-shell">
      <el-card class="admin-login-card" shadow="never">
        <div class="admin-login-header">
          <div>
            <div class="admin-meta">Hello, my world Admin Center</div>
            <h1 class="admin-login-title">独立后台登录</h1>
            <p class="admin-login-desc">
              这是专门给 PC 端使用的管理入口，用来查看用户、支线、动态、消息、文件和 AI 任务。
            </p>
          </div>
        </div>

        <el-form class="admin-login-form" @submit.prevent="submitLogin">
          <el-form-item label="管理员账号">
            <el-input
              v-model="loginForm.username"
              autocomplete="username"
              placeholder="请输入管理员账号"
              clearable
            />
          </el-form-item>

          <el-form-item label="管理员密码">
            <el-input
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入管理员密码"
              show-password
            />
          </el-form-item>

          <el-alert
            v-if="loginError"
            class="admin-alert"
            :title="loginError"
            type="error"
            show-icon
            :closable="false"
          />

          <el-button type="primary" class="admin-login-button" :loading="loginLoading" native-type="submit">
            进入后台
          </el-button>
        </el-form>

        <el-alert
          class="admin-login-note"
          title="默认账号：admin / admin123456。后面你可以通过环境变量修改。"
          type="info"
          show-icon
          :closable="false"
        />
      </el-card>
    </section>

    <el-container v-else class="admin-shell">
      <el-header class="admin-header" height="auto">
        <el-card class="admin-section-card" shadow="never">
          <div class="admin-header-inner">
            <div>
              <div class="admin-meta">Hello, my world Admin Center</div>
              <h1 class="admin-title">后台管理中心</h1>
              <p class="admin-subtitle">
                独立 PC 后台 · 用户、支线、动态、消息、文件、AI 任务统一查看
              </p>
            </div>

            <div class="admin-header-actions">
              <el-tag type="success" effect="light">
                当前管理员：{{ admin?.displayName || '后台管理员' }}
              </el-tag>
              <el-button :icon="Refresh" :loading="refreshLoading" @click="handleRefresh">刷新数据</el-button>
              <el-button type="primary" :icon="SwitchButton" @click="handleLogout">退出后台</el-button>
            </div>
          </div>
        </el-card>
      </el-header>

      <el-main class="admin-main">
        <el-alert
          v-if="statsError"
          class="admin-section"
          :title="statsError"
          type="error"
          show-icon
          :closable="false"
        />

        <el-card class="admin-section-card" shadow="never" v-loading="statsLoading">
          <div class="admin-summary-grid">
            <el-card v-for="card in summaryCards" :key="card.label" shadow="never" class="summary-card">
              <div class="summary-label">{{ card.label }}</div>
              <el-statistic :value="card.value" />
              <div class="summary-note">{{ card.note }}</div>
            </el-card>
          </div>
        </el-card>

        <el-tabs v-model="activeMainTab" class="admin-section">
          <el-tab-pane label="用户列表" name="users">
            <el-card class="admin-section-card admin-table-card" shadow="never">
              <template #header>
                <div class="admin-card-title">
                  <div>
                    <div class="section-title">用户列表</div>
                    <div class="section-subtitle">可搜索、可分页、可直接进入用户详情和支线详情</div>
                  </div>
                </div>
              </template>

              <div class="admin-toolbar">
                <el-input
                  v-model="userQuery.q"
                  class="admin-search"
                  clearable
                  placeholder="搜索用户 ID、手机号、昵称、职业、城市、支线..."
                  @keyup.enter="handleUserSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>

                <el-select v-model="userQuery.status" class="admin-select" placeholder="状态">
                  <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>

                <el-select v-model="userQuery.pageSize" class="admin-size" placeholder="每页条数" @change="handleUserPageSizeChange">
                  <el-option v-for="size in pageSizeOptions" :key="size" :label="`${size} 条/页`" :value="size" />
                </el-select>

                <el-button type="primary" :icon="Search" @click="handleUserSearch">查询</el-button>
                <el-button @click="handleUserReset">重置</el-button>
              </div>

              <el-alert
                v-if="userListError"
                class="admin-section"
                :title="userListError"
                type="error"
                show-icon
                :closable="false"
              />

              <el-table
                :data="userList"
                row-key="id"
                border
                stripe
                v-loading="userListLoading"
                :empty-text="'没有找到匹配的用户'"
                @row-click="handleUserRowClick"
              >
                <el-table-column prop="nickname" label="用户" min-width="180">
                  <template #default="{ row }">
                    <div class="table-user-cell">
                      <el-avatar :size="36">{{ userInitial(userDisplayName(row)) }}</el-avatar>
                      <div class="table-user-meta">
                        <div class="table-user-name">{{ userDisplayName(row) }}</div>
                        <div class="table-user-sub">{{ row.id }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="phone" label="手机号" min-width="140">
                  <template #default="{ row }">
                    {{ safeText(row.phone, '未绑定') }}
                  </template>
                </el-table-column>

                <el-table-column label="支线数" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag type="success" effect="light">{{ row.branchCount }}</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="最新支线" min-width="220" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div>
                      <div class="table-main-text">
                        {{ row.latestBranch ? row.latestBranch.name : '暂无支线' }}
                      </div>
                      <div class="table-sub-text">
                        {{ row.latestBranch ? `${row.latestBranch.branchNumber} · ${row.latestBranch.profession}` : '当前没有分支记录' }}
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="状态" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag :type="statusTagType(row.status)" effect="light">
                      {{ statusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="更新时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.updatedAt) }}
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="170" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click.stop="handleUserRowClick(row)">查看详情</el-button>
                    <el-button
                      link
                      type="primary"
                      @click.stop="showBranchesForUser(row.id)"
                    >
                      看支线
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="admin-table-footer">
                <el-pagination
                  v-model:current-page="userQuery.page"
                  v-model:page-size="userQuery.pageSize"
                  :total="userTotal"
                  :page-sizes="pageSizeOptions"
                  layout="total, sizes, prev, pager, next, jumper"
                  background
                  @current-change="handleUserPageChange"
                  @size-change="handleUserPageSizeChange"
                />
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="支线中心" name="branches">
            <el-card class="admin-section-card admin-table-card" shadow="never">
              <template #header>
                <div class="admin-card-title">
                  <div>
                    <div class="section-title">支线中心</div>
                    <div class="section-subtitle">单独查看每一条支线，按用户、状态和关键词检索</div>
                  </div>
                </div>
              </template>

              <div class="admin-toolbar">
                <el-input
                  v-model="branchQuery.q"
                  class="admin-search"
                  clearable
                  placeholder="搜索支线编号、名称、职业、工作地点、来源说明、所属用户..."
                  @keyup.enter="handleBranchSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>

                <el-input
                  v-model="branchQuery.userId"
                  class="admin-user-filter"
                  clearable
                  placeholder="按用户 ID 筛选支线（可选）"
                  @keyup.enter="handleBranchSearch"
                />

                <el-select v-model="branchQuery.status" class="admin-select" placeholder="状态">
                  <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>

                <el-select v-model="branchQuery.pageSize" class="admin-size" placeholder="每页条数" @change="handleBranchPageSizeChange">
                  <el-option v-for="size in pageSizeOptions" :key="size" :label="`${size} 条/页`" :value="size" />
                </el-select>

                <el-button type="primary" :icon="Search" @click="handleBranchSearch">查询</el-button>
                <el-button @click="handleBranchReset">重置</el-button>
              </div>

              <el-alert
                v-if="branchListError"
                class="admin-section"
                :title="branchListError"
                type="error"
                show-icon
                :closable="false"
              />

              <el-table
                :data="branchList"
                :row-key="branchRowKey"
                border
                stripe
                v-loading="branchListLoading"
                :empty-text="'没有找到匹配的支线'"
                @row-click="handleBranchRowClick"
              >
                <el-table-column label="支线" min-width="220">
                  <template #default="{ row }">
                    <div>
                      <div class="table-main-text">{{ row.branch.name }}</div>
                      <div class="table-sub-text">{{ row.branch.branchNumber }}</div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="所属用户" min-width="200">
                  <template #default="{ row }">
                    <div>
                      <div class="table-main-text">{{ userDisplayName({ nickname: row.user.nickname, profile: row.profile }) }}</div>
                      <div class="table-sub-text">{{ row.user.id }}</div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="用户支线数" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag type="info" effect="light">{{ row.userBranchCount }}</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="来源年份" width="130" align="center">
                  <template #default="{ row }">
                    {{ safeText(row.branch.sourceYear, '未知') }}
                  </template>
                </el-table-column>

                <el-table-column label="角色说明" min-width="260" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ safeText(row.branch.sourceDescription, '未保存来源说明') }}
                  </template>
                </el-table-column>

                <el-table-column label="动态" width="100" align="center">
                  <template #default="{ row }">
                    {{ row.branch.momentCount }}
                  </template>
                </el-table-column>

                <el-table-column label="消息" width="100" align="center">
                  <template #default="{ row }">
                    {{ row.branch.messageCount }}
                  </template>
                </el-table-column>

                <el-table-column label="状态" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag :type="statusTagType(row.branch.status)" effect="light">
                      {{ statusLabel(row.branch.status) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="更新时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.branch.updatedAt) }}
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="140" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click.stop="handleBranchRowClick(row)">查看详情</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="admin-table-footer">
                <el-pagination
                  v-model:current-page="branchQuery.page"
                  v-model:page-size="branchQuery.pageSize"
                  :total="branchTotal"
                  :page-sizes="pageSizeOptions"
                  layout="total, sizes, prev, pager, next, jumper"
                  background
                  @current-change="handleBranchPageChange"
                  @size-change="handleBranchPageSizeChange"
                />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-main>

      <el-drawer v-model="userDrawerVisible" :title="userDrawerTitle" size="84%">
        <div class="drawer-body" v-loading="selectedUserLoading">
          <el-alert
            v-if="selectedUserError"
            :title="selectedUserError"
            type="error"
            show-icon
            :closable="false"
          />

          <template v-else-if="selectedUser">
            <el-card shadow="never" class="admin-section-card">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="用户 ID">{{ selectedUser.user.id }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ safeText(selectedUser.user.phone, '未绑定') }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="statusTagType(selectedUser.user.status)" effect="light">
                    {{ statusLabel(selectedUser.user.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="昵称">{{ safeText(selectedUser.user.nickname, '未填写') }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ safeText(selectedUser.profile?.name, '未填写') }}</el-descriptions-item>
                <el-descriptions-item label="职业">{{ safeText(selectedUser.profile?.profession, '未填写') }}</el-descriptions-item>
                <el-descriptions-item label="城市">{{ safeText(selectedUser.profile?.city, '未填写') }}</el-descriptions-item>
                <el-descriptions-item label="主分支">
                  {{ selectedUser.profile?.mainBranchId || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="支线数">{{ selectedUser.stats.branches }}</el-descriptions-item>
                <el-descriptions-item label="动态数">{{ selectedUser.stats.moments }}</el-descriptions-item>
                <el-descriptions-item label="消息数">{{ selectedUser.stats.messages }}</el-descriptions-item>
                <el-descriptions-item label="文件数">{{ selectedUser.stats.files }}</el-descriptions-item>
              </el-descriptions>

              <div class="drawer-actions">
                <el-button type="primary" @click="showSelectedUserBranches">查看该用户全部支线</el-button>
                <el-button @click="refreshSelectedUser">刷新此用户</el-button>
              </div>
            </el-card>

            <el-tabs v-model="activeUserTab" class="admin-section">
              <el-tab-pane label="支线" name="branches">
                <el-card shadow="never" class="admin-section-card admin-table-card">
                  <el-table :data="selectedUserBranches" border stripe empty-text="暂无支线记录">
                    <el-table-column label="支线名称" min-width="220">
                      <template #default="{ row }">
                        <div>
                          <div class="table-main-text">{{ row.name }}</div>
                          <div class="table-sub-text">{{ row.branchNumber }}</div>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column label="角色" min-width="200">
                      <template #default="{ row }">
                        <div>
                          <div class="table-main-text">{{ row.profession }}</div>
                          <div class="table-sub-text">{{ row.workplace }}</div>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column label="来源年份" width="130" align="center">
                      <template #default="{ row }">
                        {{ safeText(row.sourceYear, '未知') }}
                      </template>
                    </el-table-column>

                    <el-table-column label="动态" width="100" align="center">
                      <template #default="{ row }">
                        {{ row.momentCount }}
                      </template>
                    </el-table-column>

                    <el-table-column label="消息" width="100" align="center">
                      <template #default="{ row }">
                        {{ row.messageCount }}
                      </template>
                    </el-table-column>

                    <el-table-column label="状态" width="110" align="center">
                      <template #default="{ row }">
                        <el-tag :type="statusTagType(row.status)" effect="light">
                          {{ statusLabel(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>

                    <el-table-column label="操作" width="120" fixed="right">
                      <template #default="{ row }">
                        <el-button link type="primary" @click.stop="openBranchDetail(row.id)">查看详情</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="动态" name="moments">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedUserMoments.length" description="暂无动态记录" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="moment in selectedUserMoments.slice(0, 12)" :key="moment.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ formatTime(moment.timestamp) }}</div>
                        <el-tag type="info" effect="light">{{ moment.branchId }}</el-tag>
                      </div>
                      <p class="detail-content">{{ moment.content }}</p>
                      <div class="detail-meta">
                        <span>评论 {{ moment.comments.length }}</span>
                        <span>点赞 {{ moment.likes.length }}</span>
                      </div>
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="消息" name="messages">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedUserMessages.length" description="暂无消息记录" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="message in selectedUserMessages.slice(0, 15)" :key="message.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ message.senderType }}</div>
                        <el-tag :type="statusTagType(message.isRead ? 'active' : 'processing')" effect="light">
                          {{ message.isRead ? '已读' : '未读' }}
                        </el-tag>
                      </div>
                      <p class="detail-content">{{ truncateText(message.content, 160) }}</p>
                      <div class="detail-meta">
                        <span>{{ formatTime(message.timestamp) }}</span>
                        <span>{{ message.contentType }}</span>
                        <span>{{ message.branchId }}</span>
                      </div>
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="文件" name="files">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedUserFiles.length" description="暂无文件记录" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="file in selectedUserFiles" :key="file.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ file.fileName }}</div>
                        <el-tag type="info" effect="light">{{ formatBytes(file.size) }}</el-tag>
                      </div>
                      <p class="detail-content text-link">{{ file.fileUrl }}</p>
                      <div class="detail-meta">
                        <span>{{ file.mimeType }}</span>
                        <span>{{ file.source }}</span>
                        <span>{{ formatTime(file.timestamp) }}</span>
                      </div>
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="AI 任务" name="jobs">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedUserJobs.length" description="暂无 AI 任务记录" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="job in selectedUserJobs" :key="job.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ job.jobType }}</div>
                        <el-tag :type="statusTagType(job.status)" effect="light">{{ statusLabel(job.status) }}</el-tag>
                      </div>
                      <p class="detail-content">{{ truncateText(job.prompt, 160) }}</p>
                      <div class="detail-meta">
                        <span>创建于 {{ formatTime(job.createdAt) }}</span>
                        <span v-if="job.completedAt">完成于 {{ formatTime(job.completedAt) }}</span>
                        <span v-else>未完成</span>
                      </div>
                      <el-alert
                        v-if="job.errorMsg"
                        class="admin-section"
                        :title="job.errorMsg"
                        type="error"
                        show-icon
                        :closable="false"
                      />
                      <el-alert
                        v-else-if="job.resultJson"
                        class="admin-section"
                        :title="truncateText(job.resultJson, 180)"
                        type="success"
                        show-icon
                        :closable="false"
                      />
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </template>

          <el-empty v-else description="请选择一个用户查看详情" />
        </div>
      </el-drawer>

      <el-drawer v-model="branchDrawerVisible" :title="branchDrawerTitle" size="72%">
        <div class="drawer-body" v-loading="selectedBranchLoading">
          <el-alert
            v-if="selectedBranchError"
            :title="selectedBranchError"
            type="error"
            show-icon
            :closable="false"
          />

          <template v-else-if="selectedBranch">
            <el-card shadow="never" class="admin-section-card">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="支线编号">{{ selectedBranch.branch.branchNumber }}</el-descriptions-item>
                <el-descriptions-item label="支线名称">{{ selectedBranch.branch.name }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="statusTagType(selectedBranch.branch.status)" effect="light">
                    {{ statusLabel(selectedBranch.branch.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="所属用户">
                  {{ userDisplayName({ nickname: selectedBranch.user.nickname, profile: selectedBranch.profile }) }}
                </el-descriptions-item>
                <el-descriptions-item label="用户 ID">{{ selectedBranch.user.id }}</el-descriptions-item>
                <el-descriptions-item label="用户支线数">{{ selectedBranch.userBranchCount }}</el-descriptions-item>
                <el-descriptions-item label="来源年份">{{ safeText(selectedBranch.branch.sourceYear, '未知') }}</el-descriptions-item>
                <el-descriptions-item label="朋友圈">{{ selectedBranch.stats.moments }}</el-descriptions-item>
                <el-descriptions-item label="消息">{{ selectedBranch.stats.messages }}</el-descriptions-item>
              </el-descriptions>

              <div class="drawer-actions">
                <el-button type="primary" @click="showBranchOwner">查看所属用户</el-button>
                <el-button @click="refreshSelectedBranch">刷新此支线</el-button>
              </div>
            </el-card>

            <el-tabs v-model="activeBranchTab" class="admin-section">
              <el-tab-pane label="朋友圈" name="moments">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedBranchMoments.length" description="暂无朋友圈内容" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="moment in selectedBranchMoments.slice(0, 12)" :key="moment.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ formatTime(moment.timestamp) }}</div>
                        <el-tag type="info" effect="light">{{ moment.branchId }}</el-tag>
                      </div>
                      <p class="detail-content">{{ moment.content }}</p>
                      <div class="detail-meta">
                        <span>评论 {{ moment.comments.length }}</span>
                        <span>点赞 {{ moment.likes.length }}</span>
                      </div>
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="消息" name="messages">
                <el-card shadow="never" class="admin-section-card">
                  <el-empty v-if="!selectedBranchMessages.length" description="暂无消息记录" />
                  <el-space v-else direction="vertical" alignment="stretch" :size="12">
                    <el-card v-for="message in selectedBranchMessages.slice(0, 15)" :key="message.id" shadow="never">
                      <div class="detail-item-top">
                        <div class="table-main-text">{{ message.senderType }}</div>
                        <el-tag :type="statusTagType(message.isRead ? 'active' : 'processing')" effect="light">
                          {{ message.isRead ? '已读' : '未读' }}
                        </el-tag>
                      </div>
                      <p class="detail-content">{{ truncateText(message.content, 160) }}</p>
                      <div class="detail-meta">
                        <span>{{ formatTime(message.timestamp) }}</span>
                        <span>{{ message.contentType }}</span>
                      </div>
                    </el-card>
                  </el-space>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </template>

          <el-empty v-else description="请选择一个支线查看详情" />
        </div>
      </el-drawer>
    </el-container>
  </div>
</template>
