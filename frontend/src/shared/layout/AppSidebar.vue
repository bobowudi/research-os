<template>
  <el-aside width="256px" class="sidebar">
    <div class="sidebar-header">
      <div class="brand-mark">
        <el-icon><Lightning /></el-icon>
      </div>
      <div class="brand-copy">
        <h1>ResearchOS</h1>
        <span>v3.1 Pro</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <section v-for="section in navSections" :key="section.label" class="nav-section">
        <div class="nav-section__label">{{ section.label }}</div>
        <div class="nav-section__items">
          <router-link
            v-for="item in section.items"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            active-class="nav-item--active"
            exact-active-class="nav-item--active"
          >
            <el-icon class="nav-item__icon"><component :is="item.icon" /></el-icon>
            <span class="nav-item__text">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
          </router-link>
        </div>
      </section>
    </nav>

    <div class="sidebar-footer">
      <el-dropdown trigger="click">
        <div class="profile-card">
          <el-avatar :size="40" :src="authStore.user?.avatarUrl" class="profile-card__avatar">
            {{ userInitial }}
          </el-avatar>
          <div class="profile-card__copy">
            <p>{{ authStore.user?.name ?? '战略部-陈总' }}</p>
            <span>{{ authStore.user?.role ?? '管理员权限' }}</span>
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
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Lightning } from '@element-plus/icons-vue'
import { useAuthStore } from '@/shared/stores/auth'
import { navSections } from './navigation'

const router = useRouter()
const authStore = useAuthStore()
const userInitial = computed(() => authStore.user?.name?.charAt(0).toUpperCase() ?? 'R')

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped lang="less">
.sidebar {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  z-index: 20;
  height: 100vh;
}

.sidebar-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.brand-mark {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.22);

  .el-icon {
    font-size: 22px;
  }
}

.brand-copy {
  min-width: 0;

  h1 {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
  }

  span {
    display: inline-flex;
    margin-top: 4px;
    padding: 2px 6px;
    border-radius: 6px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.nav-section {
  & + & {
    margin-top: 24px;
  }

  &__label {
    padding: 0 16px;
    margin-bottom: 8px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #0f172a;
    background: #f8fafc;
  }

  &--active {
    color: #2563eb;
    background: #eff6ff;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 4px;
      height: 100%;
      background: #2563eb;
    }
  }

  &__icon {
    font-size: 18px;
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__badge {
    margin-left: auto;
    padding: 2px 6px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 10px;
    font-weight: 800;
  }
}

.sidebar-footer {
  padding: 24px;
  border-top: 1px solid #f1f5f9;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &__avatar {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1d4ed8;
    font-weight: 800;
  }

  &__copy {
    min-width: 0;

    p {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #0f172a;
      font-size: 14px;
      font-weight: 800;
    }

    span {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
    }
  }
}

@media (max-width: 1200px) {
  .sidebar {
    width: 224px;
  }
}

@media (max-width: 960px) {
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .sidebar-nav {
    max-height: 280px;
  }
}
</style>
