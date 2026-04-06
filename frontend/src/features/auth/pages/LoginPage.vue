<template>
  <div class="login-page">
    <!-- 左侧：登录控制区 (40%) -->
    <section class="login-left">
      <!-- 品牌 Logo -->
      <div class="brand">
        <div class="brand-icon">
          <svg class="brand-svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14H11V21L20 10H13Z" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">ResearchOS</span>
          <span class="brand-label">Enterprise Portal</span>
        </div>
      </div>

      <!-- 登录表单主体 -->
      <div class="login-form-wrapper">
        <div class="login-header">
          <h2 class="login-title">AUTHORIZE</h2>
          <p class="login-desc">
            请输入您的凭证以访问
            <span class="highlight">ResearchOS</span>
            智能决策系统。
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-fields">
            <div class="field-group">
              <label class="field-label">工作邮箱</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="analyst@researchos.ai"
                class="field-input"
              />
            </div>

            <div class="field-group">
              <div class="field-label-row">
                <label class="field-label">访问密码</label>
                <router-link to="/forgot-password" class="field-link">重置</router-link>
              </div>
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="••••••••••••"
                class="field-input"
              />
            </div>
          </div>

          <div class="remember-row">
            <label class="remember-label">
              <input v-model="form.remember" type="checkbox" class="remember-checkbox" />
              <span>信任此终端设备</span>
            </label>
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="loading"
          >
            <span v-if="!loading">同步身份进入</span>
            <div v-else class="spinner" />
            <svg
              v-if="!loading"
              class="arrow-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <div v-if="error" class="error-alert">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ error }}</span>
          </div>
        </form>

        <div class="register-link">
          还没有账号？
          <router-link to="/register" class="register-link-action">注册组织</router-link>
        </div>
      </div>

      <!-- 底部状态 -->
      <footer class="login-footer">
        <div class="footer-status">
          <span class="footer-label">集群状态</span>
          <div class="footer-indicator">
            <div class="status-dot" />
            <span class="status-text">ONLINE (12ms)</span>
          </div>
        </div>
        <div class="footer-copyright">&copy; 2026 RESEARCHOS</div>
      </footer>
    </section>

    <!-- 右侧：插画呈现区 (60%) -->
    <section class="login-right">
      <div class="illustration-container">
        <img
          :src="loginImage"
          alt="ResearchOS 架构插画"
          class="illustration-img"
        />
      </div>

      <!-- 环境点缀 -->
      <div class="bg-dots" />
      <div class="bg-glow bg-glow--top" />
      <div class="bg-glow bg-glow--bottom" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import loginImage from '@/assects/login.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

async function handleLogin() {
  if (!form.email || !form.password) return

  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.email, form.password)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || '登录失败，请检查邮箱和密码后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
// ==================== Variables ====================
@blue-600: #2563eb;
@blue-700: #1d4ed8;
@slate-50: #f8fafc;
@slate-100: #f1f5f9;
@slate-200: #e2e8f0;
@slate-300: #cbd5e1;
@slate-400: #94a3b8;
@slate-500: #64748b;
@slate-600: #475569;
@slate-900: #0f172a;
@red-500: #ef4444;
@red-50: #fef2f2;
@green-500: #22c55e;

// ==================== Layout ====================
.login-page {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

// ==================== Left Section ====================
.login-left {
  width: 40%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 48px 80px;
  position: relative;
  z-index: 20;
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.02);
  border-right: 1px solid @slate-100;
}

// Brand
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  animation: fadeInDown 0.6s ease-out;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: @blue-600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
}

.brand-svg {
  color: #fff;
  width: 24px;
  height: 24px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: @slate-900;
  line-height: 1;
}

.brand-label {
  font-size: 10px;
  font-weight: 800;
  color: @blue-600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 4px;
}

// Form wrapper
.login-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 380px;
  margin: 0 auto;
  width: 100%;
  animation: fadeIn 0.8s ease-out;
}

.login-header {
  margin-bottom: 48px;
}

.login-title {
  font-size: 40px;
  font-weight: 900;
  color: @slate-900;
  letter-spacing: -1px;
  margin: 0 0 12px 0;
  font-style: italic;
}

.login-desc {
  color: @slate-400;
  font-weight: 500;
  line-height: 1.6;
  font-size: 14px;
  margin: 0;
}

.highlight {
  color: @blue-600;
  font-weight: 700;
}

// Form
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 10px;
  font-weight: 700;
  color: @slate-500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-left: 4px;
}

.field-link {
  font-size: 10px;
  font-weight: 700;
  color: @blue-600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.field-input {
  width: 100%;
  padding: 16px 24px;
  background: @slate-50;
  border: 1.5px solid @slate-200;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: @slate-900;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: @slate-300;
    font-weight: 500;
  }

  &:focus {
    border-color: @blue-600;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
}

// Remember
.remember-row {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  span {
    font-size: 11px;
    font-weight: 700;
    color: @slate-400;
    text-transform: uppercase;
  }
}

.remember-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid @slate-300;
  accent-color: @blue-600;
  cursor: pointer;
}

// Submit button
.submit-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, @blue-600 0%, @blue-700 100%);
  box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.4);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-weight: 900;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 14px 36px -5px rgba(37, 99, 235, 0.5);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// Error alert
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: @red-50;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  font-size: 13px;
  color: @red-500;
  font-weight: 600;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

// Register link
.register-link {
  margin-top: 24px;
  font-size: 14px;
  color: @slate-400;
}

.register-link-action {
  color: @blue-600;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ==================== Footer ====================
.login-footer {
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid @slate-100;
}

.footer-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-label {
  font-size: 9px;
  font-weight: 900;
  color: @slate-300;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.footer-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: @green-500;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.status-text {
  font-size: 10px;
  font-weight: 700;
  color: @slate-600;
  letter-spacing: -0.3px;
}

.footer-copyright {
  font-size: 10px;
  font-weight: 700;
  color: @slate-300;
  text-transform: uppercase;
  letter-spacing: 0.3em;
}

// ==================== Right Section ====================
.login-right {
  display: none;
  width: 60%;
  height: 100%;
  background: #f8fbff;
  position: relative;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 64px;

  @media (min-width: 1024px) {
    display: flex;
  }
}

.illustration-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: zoomIn 0.6s ease-out, floating 6s ease-in-out infinite;
}

.illustration-img {
  max-width: 95%;
  max-height: 90%;
  object-fit: contain;
  filter: drop-shadow(0 50px 80px rgba(37, 99, 235, 0.15));
}

// Background decorations
.bg-dots {
  position: absolute;
  inset: 0;
  background: radial-gradient(#3b82f6 1.2px, transparent 1.2px);
  background-size: 40px 40px;
  opacity: 0.04;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;

  &--top {
    top: -10%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: rgba(191, 219, 254, 0.4);
    filter: blur(120px);
  }

  &--bottom {
    bottom: -10%;
    left: -10%;
    width: 400px;
    height: 400px;
    background: rgba(224, 231, 255, 0.5);
    filter: blur(100px);
  }
}

// ==================== Responsive ====================
@media (max-width: 1023px) {
  .login-left {
    width: 100%;
    padding: 32px 24px;
  }
}

@media (min-width: 1024px) and (max-width: 1440px) {
  .login-left {
    padding: 40px 56px;
  }
}

// ==================== Animations ====================
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes floating {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
