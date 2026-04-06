<template>
  <AuthShell>
    <AuthCardFrame
      title="注册 ResearchOS"
      subtitle="创建你的组织并开始使用"
      footer-text="已有账号? "
      footer-link-to="/login"
      footer-link-label="登录"
    >
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
    </AuthCardFrame>

    <template #panel>
      <AuthFeaturePanel>
        <template #title>
          为你的团队搭建<br />研究操作系统
        </template>
        <template #description>
          创建组织后即可统一管理议题、证据、洞察与决策，让研究流程从分散记录变成可追踪的系统工程。
        </template>

        <AuthFeatureItem icon="🏢" label="组织级工作空间" tone="cyan" />
        <AuthFeatureItem icon="🔎" label="议题与证据统一管理" tone="violet" />
        <AuthFeatureItem icon="⚡" label="AI 决策链路快速启动" tone="amber" />
      </AuthFeaturePanel>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthCardFrame from '../components/AuthCardFrame.vue'
import AuthFeatureItem from '../components/AuthFeatureItem.vue'
import AuthFeaturePanel from '../components/AuthFeaturePanel.vue'
import AuthShell from '../components/AuthShell.vue'
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

<style scoped lang="less">
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-weight: 500;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  input,
  select {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.btn-primary {
  padding: 12px;
  margin-top: 8px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
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

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
