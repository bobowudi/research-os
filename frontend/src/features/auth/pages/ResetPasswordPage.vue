<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">重置密码</h1>
      <form class="auth-form" @submit.prevent="handleReset">
        <div class="form-group">
          <label>新密码</label>
          <input v-model="form.password" type="password" placeholder="至少8位" required />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input v-model="form.confirmPassword" type="password" placeholder="再次输入" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient } from '@/shared/api/client'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = reactive({ password: '', confirmPassword: '' })

async function handleReset() {
  if (form.password !== form.confirmPassword) { error.value = '两次密码不一致'; return }
  loading.value = true; error.value = ''
  try {
    await apiClient.post('/api/auth/reset-password', { token: route.params.token, newPassword: form.password })
    router.push('/login')
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '重置失败'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.auth-card { width: 420px; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.auth-title { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 24px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-weight: 500; font-size: 13px; color: #666; }
.form-group input { padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 14px; }
.btn-primary { padding: 12px; background: #1677ff; color: #fff; border-radius: 8px; font-size: 15px; font-weight: 600; }
.btn-primary:disabled { opacity: 0.6; }
.error-message { color: #f5222d; font-size: 13px; text-align: center; }
</style>
