// ==================== Vue Router 配置 ====================

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'

// ====== 布局 ======
const MainLayout = () => import('@/shared/components/MainLayout.vue')

// ====== 认证页面 ======
const LoginPage = () => import('@/features/auth/pages/LoginPage.vue')
const RegisterPage = () => import('@/features/auth/pages/RegisterPage.vue')
const InviteAcceptPage = () => import('@/features/auth/pages/InviteAcceptPage.vue')
const ForgotPasswordPage = () => import('@/features/auth/pages/ForgotPasswordPage.vue')
const ResetPasswordPage = () => import('@/features/auth/pages/ResetPasswordPage.vue')

// ====== 业务页面 ======
const DashboardPage = () => import('@/features/dashboard/pages/DashboardPage.vue')
const IssueListPage = () => import('@/features/issues/pages/IssueListPage.vue')
const IssueDetailPage = () => import('@/features/issues/pages/IssueDetailPage.vue')
const EvidenceListPage = () => import('@/features/evidence/pages/EvidenceListPage.vue')
const InsightListPage = () => import('@/features/insights/pages/InsightListPage.vue')
const DecisionListPage = () => import('@/features/decisions/pages/DecisionListPage.vue')
const DecisionDetailPage = () => import('@/features/decisions/pages/DecisionDetailPage.vue')
const ActionListPage = () => import('@/features/actions/pages/ActionListPage.vue')
const ReviewListPage = () => import('@/features/reviews/pages/ReviewListPage.vue')
const SignalListPage = () => import('@/features/signals/pages/SignalListPage.vue')
const DataSourceListPage = () => import('@/features/data-sources/pages/DataSourceListPage.vue')
const SettingsPage = () => import('@/features/settings/pages/SettingsPage.vue')

const routes: RouteRecordRaw[] = [
  // ====== 公开路由（无需登录）======
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/invite/:token',
    name: 'invite-accept',
    component: InviteAcceptPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: ResetPasswordPage,
    meta: { requiresAuth: false },
  },

  // ====== 受保护路由（需要登录）======
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'issues',
        name: 'issues',
        component: IssueListPage,
      },
      {
        path: 'issues/:id',
        name: 'issue-detail',
        component: IssueDetailPage,
      },
      {
        path: 'evidence',
        name: 'evidence',
        component: EvidenceListPage,
      },
      {
        path: 'insights',
        name: 'insights',
        component: InsightListPage,
      },
      {
        path: 'decisions',
        name: 'decisions',
        component: DecisionListPage,
      },
      {
        path: 'decisions/:id',
        name: 'decision-detail',
        component: DecisionDetailPage,
      },
      {
        path: 'actions',
        name: 'actions',
        component: ActionListPage,
      },
      {
        path: 'reviews',
        name: 'reviews',
        component: ReviewListPage,
      },
      {
        path: 'signals',
        name: 'signals',
        component: SignalListPage,
      },
      {
        path: 'data-sources',
        name: 'data-sources',
        component: DataSourceListPage,
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsPage,
      },
    ],
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ====== 路由守卫 ======
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 如果还没初始化，尝试恢复会话
  if (!authStore.initialized) {
    await authStore.initFromStorage()
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!requiresAuth && authStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})
