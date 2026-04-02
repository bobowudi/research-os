<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-box">
          <span class="logo-letter">R</span>
        </div>
        <h1 class="logo-text">ResearchOS</h1>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" exact-active-class="active">
          <el-icon class="nav-icon"><PieChart /></el-icon>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/issues" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><List /></el-icon>
          <span>议题管理</span>
        </router-link>
        <router-link to="/evidence" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Document /></el-icon>
          <span>证据库</span>
        </router-link>
        <router-link to="/insights" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Opportunity /></el-icon>
          <span>洞察集</span>
        </router-link>
        <router-link to="/decisions" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Aim /></el-icon>
          <span>决策卡</span>
        </router-link>
        <router-link to="/actions" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><CircleCheck /></el-icon>
          <span>行动项</span>
        </router-link>
        <router-link to="/reviews" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Search /></el-icon>
          <span>回顾评价</span>
        </router-link>
        <router-link to="/signals" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Connection /></el-icon>
          <span>信号监测</span>
        </router-link>
        <router-link to="/data-sources" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Link /></el-icon>
          <span>数据源</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/settings" class="nav-item" active-class="active">
          <el-icon class="nav-icon"><Setting /></el-icon>
          <span>设置</span>
        </router-link>
        <button class="nav-item logout-btn" @click="handleLogout">
          <el-icon class="nav-icon"><SwitchButton /></el-icon>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="top-bar">
        <div class="breadcrumb">
          <span class="breadcrumb-prefix">ResearchOS</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ currentTitle }}</span>
        </div>
        <div class="user-info">
          <el-dropdown trigger="click">
            <div class="user-profile">
              <el-avatar :size="32" :src="authStore.user?.avatar" class="profile-avatar">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-details">
                <span class="user-name">{{ authStore.user?.username }}</span>
                <span class="user-role">{{ authStore.user?.role }}</span>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/settings')">个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="page-container">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
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
    insights: '洞察集',
    decisions: '决策卡',
    'decision-detail': '决策详情',
    actions: '行动项',
    reviews: '回顾评价',
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

<style scoped lang="less">
.main-layout {
  display: flex;
  height: 100vh;
  background: @gradient-page-bg;
  font-family: @font-family-base;
  color: @text-primary;
}

// ===== Sidebar =====
.sidebar {
  width: 240px;
  background: @sidebar-bg;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 4px 0 24px rgba(30, 27, 75, 0.15);
}

.sidebar-header {
  padding: 28px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .logo-box {
    width: 36px;
    height: 36px;
    background: @gradient-primary;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);

    .logo-letter {
      color: #fff;
      font-size: 18px;
      font-weight: 900;
    }
  }

  .logo-text {
    font-size: 17px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.3px;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 2px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13.5px;
  font-weight: 500;
  border-radius: @radius-md;
  transition: @transition-base;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);

    .nav-icon {
      color: @accent-color;
    }
  }
}

.nav-icon {
  font-size: 18px;
  transition: @transition-base;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.logout-btn {
  color: rgba(255, 255, 255, 0.4);
  &:hover {
    background-color: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }
}

// ===== Main Content =====
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 60px;
  background: @topbar-bg;
  backdrop-filter: blur(@glass-blur);
  border-bottom: 1px solid @border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;

  .breadcrumb-prefix {
    color: @text-tertiary;
    font-weight: 500;
  }

  .breadcrumb-separator {
    color: @border-color;
  }

  .breadcrumb-current {
    color: @text-primary;
    font-weight: 700;
  }
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: @radius-md;
  transition: @transition-base;

  &:hover {
    background-color: rgba(99, 102, 241, 0.06);
  }
}

.profile-avatar {
  background: @gradient-primary;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  .user-name {
    font-size: 13px;
    font-weight: 700;
    color: @text-primary;
  }

  .user-role {
    font-size: 11px;
    color: @text-tertiary;
    text-transform: capitalize;
  }
}

.page-container {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  background: @gradient-page-bg;
}

// ===== Transitions =====
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(8px);
  opacity: 0;
}

.slide-fade-leave-to {
  opacity: 0;
}
</style>
