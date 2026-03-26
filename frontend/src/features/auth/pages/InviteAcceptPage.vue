<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">接受邀请</h1>
      <p class="auth-subtitle">完成注册加入团队</p>
      <form class="auth-form" @submit.prevent="handleAccept">
        <div class="form-group">
          <label>姓名</label>
          <input v-model="form.name" type="text" placeholder="你的姓名" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="设置密码" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '接受邀请并注册' }}
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
const form = reactive({ name: '', password: '' })

async function handleAccept() {
  loading.value = true
  error.value = ''
  try {
    await apiClient.post('/api/auth/invite-register', {
      inviteToken: route.params.token,
      name: form.name,
      password: form.password,
    })
    router.push('/login')
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '注册失败'
  } finally {
    loading.value = false
  }
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
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-message { color: #f5222d; font-size: 13px; text-align: center; }
</style>
