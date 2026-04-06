<template>
  <div class="auth-card">
    <div class="auth-header">
      <slot name="brand">
        <div class="logo-box">
          <span class="logo-letter">{{ logoLetter }}</span>
        </div>
      </slot>

      <h1 class="auth-title">{{ title }}</h1>
      <p class="auth-subtitle">{{ subtitle }}</p>
    </div>

    <slot />

    <div v-if="footerText && footerLinkLabel" class="auth-footer">
      {{ footerText }}
      <router-link :to="footerLinkTo" class="footer-link">{{ footerLinkLabel }}</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle: string
  logoLetter?: string
  footerText?: string
  footerLinkTo?: string
  footerLinkLabel?: string
}>(), {
  logoLetter: 'R',
  footerText: '',
  footerLinkTo: '/login',
  footerLinkLabel: '',
})
</script>

<style scoped lang="less">
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
}

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
}

.logo-letter {
  color: #fff;
  font-size: 24px;
  font-weight: 900;
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

.auth-footer {
  margin-top: 32px;
  font-size: 14px;
  color: @text-tertiary;
}

.footer-link {
  color: @primary-color;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

@media (max-width: 960px) {
  .auth-card {
    width: 100%;
    min-height: auto;
    padding: 40px 24px;
  }
}
</style>
