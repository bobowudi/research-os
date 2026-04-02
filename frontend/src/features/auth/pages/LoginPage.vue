<template>
  <div class="auth-page">
    <!-- Decorative background -->
    <div class="bg-pattern"></div>
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>
    <div class="bg-blob blob-3"></div>

    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-box">
          <span class="logo-letter">R</span>
        </div>
        <h1 class="auth-title">ResearchOS</h1>
        <p class="auth-subtitle">AI 驱动的研究决策系统</p>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="loginForm"
        label-position="top"
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="name@company.com"
            :prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="输入密码"
            :prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
          <router-link to="/forgot-password" class="forgot-link">忘记密码?</router-link>
        </div>

        <el-button
          type="primary"
          native-type="submit"
          class="submit-btn"
          :loading="loading"
          size="large"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>

        <el-alert
          v-if="error"
          :title="error"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />
      </el-form>

      <div class="auth-footer">
        还没有账号? <router-link to="/register" class="register-link">注册组织</router-link>
      </div>
    </div>

    <div class="auth-side-info">
      <div class="info-content">
        <h2 class="info-title">让 AI 驱动你的<br/>研究决策流程</h2>
        <p class="info-desc">从信号采集到洞察生成，从证据管理到决策建议，ResearchOS 为你的团队提供全链路智能支持。</p>
        <div class="info-features">
          <div class="feature-item">
            <div class="feature-icon feature-icon-1">📊</div>
            <span>智能信号监测</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon feature-icon-2">🧠</div>
            <span>AI 深度洞察</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon feature-icon-3">🎯</div>
            <span>数据驱动决策</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { Message, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginForm = ref<FormInstance>()
const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' }
  ]
})

async function handleLogin() {
  if (!loginForm.value) return

  await loginForm.value.validate(async (valid) => {
    if (valid) {
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
  })
}
</script>

<style scoped lang="less">
.auth-page {
  min-height: 100vh;
  display: flex;
  font-family: @font-family-base;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
}

// ===== Background Decorations =====
.bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0);
  background-size: 32px 32px;
  z-index: 1;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  z-index: 2;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
  top: -150px;
  right: 20%;
  filter: blur(60px);
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  bottom: -100px;
  left: 10%;
  filter: blur(80px);
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
  top: 50%;
  right: 5%;
  filter: blur(60px);
}

// ===== Login Card =====
.auth-card {
  position: relative;
  z-index: 10;
  width: 480px;
  min-height: 100vh;
  background: #fff;
  padding: 60px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.15);
}

.auth-header {
  margin-bottom: 40px;

  .logo-box {
    width: 52px;
    height: 52px;
    background: @gradient-primary;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);

    .logo-letter {
      color: #fff;
      font-size: 24px;
      font-weight: 900;
    }
  }

  .auth-title {
    font-size: 28px;
    font-weight: 800;
    color: @text-primary;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }

  .auth-subtitle {
    font-size: 15px;
    color: @text-tertiary;
    font-weight: 500;
  }
}

.auth-form {
  :deep(.el-form-item__label) {
    color: @text-secondary;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.el-input__wrapper) {
    border-radius: @radius-md;
    box-shadow: none !important;
    border: 1.5px solid @border-color;
    padding: 6px 14px;
    transition: @transition-base;

    &.is-focus {
      border-color: @primary-color;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;

  .forgot-link {
    font-size: 13px;
    color: @primary-color;
    text-decoration: none;
    font-weight: 600;

    &:hover { text-decoration: underline; }
  }
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: @gradient-primary;
  border: none;
  font-weight: 700;
  font-size: 15px;
  border-radius: @radius-md;
  color: #fff;
  transition: @transition-base;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
  }
}

.error-alert {
  margin-top: 16px;
}

.auth-footer {
  margin-top: 32px;
  font-size: 14px;
  color: @text-tertiary;

  .register-link {
    color: @primary-color;
    font-weight: 700;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

// ===== Right Side Info Panel =====
.auth-side-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 5;
  padding: 60px;
}

.info-content {
  max-width: 480px;

  .info-title {
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 1.2;
    letter-spacing: -1px;
    margin-bottom: 20px;
  }

  .info-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.7;
    margin-bottom: 40px;
  }
}

.info-features {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: @radius-lg;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    backdrop-filter: blur(8px);
    transition: @transition-base;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateX(4px);
    }
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .feature-icon-1 { background: rgba(6, 182, 212, 0.2); }
  .feature-icon-2 { background: rgba(139, 92, 246, 0.2); }
  .feature-icon-3 { background: rgba(245, 158, 11, 0.2); }
}
</style>
