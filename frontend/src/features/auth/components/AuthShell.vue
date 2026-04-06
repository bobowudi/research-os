<template>
  <div class="auth-page">
    <div class="bg-pattern"></div>
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>
    <div class="bg-blob blob-3"></div>

    <slot />
    <slot name="panel" />
  </div>
</template>

<style scoped lang="less">
.auth-page {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0);
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

@media (max-width: 960px) {
  .auth-page {
    flex-direction: column;
  }
}
</style>
