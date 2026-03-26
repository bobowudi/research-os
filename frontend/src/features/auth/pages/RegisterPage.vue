<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">注册 ResearchOS</h1>
      <p class="auth-subtitle">创建你的组织并开始使用</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label>姓名</label>
            <input v-model="form.name" type="text" placeholder="你的姓名" required />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" placeholder="your@email.com" required />
          </div>
        </div>

        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="至少8位，包含大小写、数字、特殊字符" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>组织名称</label>
            <input v-model="form.orgName" type="text" placeholder="你的公司或团队名称" required />
          </div>
          <div class="form-group">
            <label>组织标识 (slug)</label>
            <input v-model="form.orgSlug" type="text" placeholder="my-org" required pattern="[a-z0-9-]+" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>行业</label>
            <input v-model="form.industry" type="text" placeholder="可选" />
          </div>
          <div class="form-group">
            <label>团队规模</label>
            <select v-model="form.teamSize">
              <option value="">请选择</option>
              <option value="1-5">1-5 人</option>
              <option value="6-20">6-20 人</option>
              <option value="21-50">21-50 人</option>
              <option value="51-200">51-200 人</option>
              <option value="200+">200+ 人</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <p class="auth-footer">
        已有账号? <router-link to="/login">登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const form = reactive({
  name: '',
  email: '',
  password: '',
  orgName: '',
  orgSlug: '',
  industry: '',
  teamSize: '',
})

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(form)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  width: 540px;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: var(--shadow-lg);
}

.auth-title { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 4px; }
.auth-subtitle { text-align: center; color: var(--color-text-secondary); margin-bottom: 32px; }

.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-weight: 500; font-size: 13px; color: var(--color-text-secondary); }
.form-group input, .form-group select {
  padding: 10px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); font-size: 14px;
}
.form-group input:focus, .form-group select:focus {
  outline: none; border-color: var(--color-primary);
}

.btn-primary {
  padding: 12px; background: var(--color-primary); color: #fff;
  border-radius: var(--radius-md); font-size: 15px; font-weight: 600; margin-top: 8px;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-message { color: var(--color-danger); font-size: 13px; text-align: center; }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--color-text-secondary); }
</style>
