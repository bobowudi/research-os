<template>
  <el-container class="app-shell">
    <AppSidebar />

    <el-container class="workspace">
      <AppWorkspaceHeader :title="currentTitle" />

      <el-main class="workspace-content">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <button class="floating-help" type="button" aria-label="帮助">
        <el-icon><QuestionFilled /></el-icon>
      </button>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { QuestionFilled } from '@element-plus/icons-vue'
import AppSidebar from '@/shared/layout/AppSidebar.vue'
import AppWorkspaceHeader from '@/shared/layout/AppWorkspaceHeader.vue'
import { routeTitles } from '@/shared/layout/navigation'

const route = useRoute()
const currentTitle = computed(() => routeTitles[(route.name as string) ?? ''] ?? 'ResearchOS')
</script>

<style scoped lang="less">
.app-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
  color: #1e293b;
}

.workspace {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workspace-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  position: relative;
  min-width: 0;
  background: #f8fafc;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 999px;
  }
}

.floating-help {
  position: absolute;
  right: 32px;
  bottom: 32px;
  width: 56px;
  height: 56px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  box-shadow: 0 24px 40px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.06);
  }

  .el-icon {
    font-size: 22px;
  }
}

.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .workspace-content {
    padding: 24px;
  }
}

@media (max-width: 960px) {
  .app-shell {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }

  .workspace-content {
    padding: 20px;
  }

  .floating-help {
    right: 20px;
    bottom: 20px;
  }
}

:deep(.el-container) {
  min-width: 0;
}

:deep(.el-main) {
  --el-main-padding: 0;
}
</style>
