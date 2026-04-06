<template>
  <footer class="module-footer">
    <div class="module-footer__status">
      <div class="engine-indicator">
        <span class="engine-indicator__dot"></span>
        <span>ResearchOS 3.1 核心引擎在线</span>
      </div>
      <div class="module-footer__metrics">
        <span>同步: 28s 前</span>
        <span>响应: 18ms</span>
      </div>
    </div>

    <div class="module-footer__links">
      <a href="#">Privacy</a>
      <a href="#">Support</a>
      <span class="module-footer__version">v3.1.2-beta</span>
    </div>
  </footer>
</template>

<style scoped lang="less">
.module-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 8px 0;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;

  &__status,
  &__links,
  &__metrics {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &__metrics {
    padding-left: 24px;
    border-left: 1px solid #e2e8f0;
  }

  &__links {
    letter-spacing: 0.18em;
    text-transform: uppercase;

    a {
      color: #64748b;
      transition: color 0.25s ease;

      &:hover {
        color: #2563eb;
      }
    }
  }

  &__version {
    padding: 6px 10px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 9px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  }
}

.engine-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
}

@media (max-width: 960px) {
  .module-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
