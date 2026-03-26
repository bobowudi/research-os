<template>
  <div class="page">
    <h2>设置</h2>
    <div class="settings-grid">
      <div class="card">
        <h3>个人信息</h3>
        <p class="text-secondary">管理你的账号信息和密码</p>
      </div>
      <div class="card" v-if="authStore.isAdmin">
        <h3>团队管理</h3>
        <p class="text-secondary">邀请成员、管理角色权限</p>
      </div>
      <div class="card" v-if="authStore.isAdmin">
        <h3>组织设置</h3>
        <p class="text-secondary">配置组织信息和配额</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/shared/stores/auth'
const authStore = useAuthStore()
</script>

<style scoped>
h2 { margin-bottom: 24px; }
.settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); cursor: pointer; }
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.card h3 { font-size: 16px; margin-bottom: 8px; }
.text-secondary { color: #666; font-size: 14px; }
</style>
