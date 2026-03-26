<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">登录 ResearchOS</h1>
      <p class="auth-subtitle">AI 驱动的研究决策系统</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="输入密码"
            required
            autocomplete="current-password"
          />
        </div>

        <div class="form-actions">
          <router-link to="/forgot-password" class="forgot-link">忘记密码?</router-link>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <p class="auth-footer">
        还没有账号? <router-link to="/register">注册组织</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const form = reactive({ email: '', password: '' })

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(form.email, form.password)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '登录失败，请重试'
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
  width: 420px;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: var(--shadow-lg);
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4px;
}

.auth-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.form-actions {
  text-align: right;
}

.forgot-link {
  font-size: 13px;
  color: var(--color-primary);
}

.btn-primary {
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--color-danger);
  font-size: 13px;
  text-align: center;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
