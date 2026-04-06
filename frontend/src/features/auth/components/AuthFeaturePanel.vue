<template>
  <div class="auth-side-info">
    <div class="info-content">
      <h2 class="info-title">
        <slot name="title" />
      </h2>
      <p class="info-desc">
        <slot name="description" />
      </p>
      <div class="info-features">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
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
}

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

.info-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 960px) {
  .auth-side-info {
    padding: 24px;
  }

  .info-title {
    font-size: 32px;
  }
}
</style>
