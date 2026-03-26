<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">忘记密码</h1>
      <p class="auth-subtitle">输入邮箱，我们将发送重置链接</p>
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="your@email.com" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '发送中...' : '发送重置链接' }}
        </button>
        <p v-if="success" class="success-message">重置链接已发送到你的邮箱</p>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
      <p class="auth-footer"><router-link to="/login">返回登录</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/shared/api/client'

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  loading.value = true; error.value = ''; success.value = false
  try {
    await apiClient.post('/api/auth/forgot-password', { email: email.value })
    success.value = true
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '发送失败'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.auth-card { width: 420px; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.auth-title { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 4px; }
.auth-subtitle { text-align: center; color: #666; margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-weight: 500; font-size: 13px; color: #666; }
.form-group input { padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 14px; }
.btn-primary { padding: 12px; background: #1677ff; color: #fff; border-radius: 8px; font-size: 15px; font-weight: 600; }
.btn-primary:disabled { opacity: 0.6; }
.success-message { color: #52c41a; font-size: 13px; text-align: center; }
.error-message { color: #f5222d; font-size: 13px; text-align: center; }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #666; }
</style>
