<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">ResearchOS</h1>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active">
          <span class="nav-icon">📊</span>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/issues" class="nav-item" active-class="active">
          <span class="nav-icon">📋</span>
          <span>议题</span>
        </router-link>
        <router-link to="/evidence" class="nav-item" active-class="active">
          <span class="nav-icon">📄</span>
          <span>证据</span>
        </router-link>
        <router-link to="/insights" class="nav-item" active-class="active">
          <span class="nav-icon">💡</span>
          <span>洞察</span>
        </router-link>
        <router-link to="/decisions" class="nav-item" active-class="active">
          <span class="nav-icon">🎯</span>
          <span>决策</span>
        </router-link>
        <router-link to="/actions" class="nav-item" active-class="active">
          <span class="nav-icon">✅</span>
          <span>行动</span>
        </router-link>
        <router-link to="/reviews" class="nav-item" active-class="active">
          <span class="nav-icon">🔍</span>
          <span>回看</span>
        </router-link>
        <router-link to="/signals" class="nav-item" active-class="active">
          <span class="nav-icon">📡</span>
          <span>信号</span>
        </router-link>
        <router-link to="/data-sources" class="nav-item" active-class="active">
          <span class="nav-icon">🔗</span>
          <span>数据源</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/settings" class="nav-item" active-class="active">
          <span class="nav-icon">⚙️</span>
          <span>设置</span>
        </router-link>
        <button class="nav-item logout-btn" @click="handleLogout">
          <span class="nav-icon">🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="top-bar">
        <div class="breadcrumb">{{ currentTitle }}</div>
        <div class="user-info">
          <span class="user-name">{{ authStore.user?.name }}</span>
          <span class="user-role">{{ authStore.userRole }}</span>
        </div>
      </header>

      <div class="page-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentTitle = computed(() => {
  const name = route.name as string
  const titles: Record<string, string> = {
    dashboard: '仪表盘',
    issues: '议题管理',
    'issue-detail': '议题详情',
    evidence: '证据库',
    insights: '洞察',
    decisions: '决策卡',
    'decision-detail': '决策详情',
    actions: '行动项',
    reviews: '回看',
    signals: '信号监测',
    'data-sources': '数据源',
    settings: '设置',
  }
  return titles[name] || 'ResearchOS'
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.nav-item:hover,
.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  background: var(--color-primary);
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 0;
}

.logout-btn {
  color: rgba(255, 255, 255, 0.45);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.breadcrumb {
  font-size: 16px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.page-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
