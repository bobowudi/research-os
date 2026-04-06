<template>
  <div class="dashboard">
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1 class="welcome-title">欢迎回来 👋</h1>
        <p class="welcome-desc">以下是你的研究决策系统概览</p>
      </div>
      <div class="welcome-art">
        <div class="art-circle c1"></div>
        <div class="art-circle c2"></div>
        <div class="art-circle c3"></div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, i) in stats" :key="stat.label" :class="`stat-${i}`">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dash-card">
        <div class="card-header">
          <h3>🔥 紧急决策</h3>
        </div>
        <p class="text-secondary" v-if="!data">加载中...</p>
        <div class="card-list" v-if="data?.urgentDecisions?.length">
          <div class="list-item" v-for="d in data.urgentDecisions" :key="d.id">
            <span class="item-text">{{ d.recommendation?.slice(0, 60) }}...</span>
            <el-tag size="small" type="danger" effect="light" round>{{ (d.confidence * 100).toFixed(0) }}%</el-tag>
          </div>
        </div>
        <div v-else-if="data" class="card-empty">暂无紧急决策</div>
      </div>

      <div class="dash-card">
        <div class="card-header">
          <h3>📋 我的议题</h3>
        </div>
        <div class="card-list" v-if="data?.myWorkItems?.ownedIssues?.length">
          <div class="list-item" v-for="issue in data.myWorkItems.ownedIssues" :key="issue.id">
            <router-link :to="`/issues/${issue.id}`" class="item-link">{{ issue.title }}</router-link>
            <el-tag size="small" effect="plain" round>{{ issue.status }}</el-tag>
          </div>
        </div>
        <div v-else-if="data" class="card-empty">暂无议题</div>
      </div>

      <div class="dash-card">
        <div class="card-header">
          <h3>✅ 我的行动项</h3>
        </div>
        <div class="card-list" v-if="data?.myWorkItems?.assignedActions?.length">
          <div class="list-item" v-for="action in data.myWorkItems.assignedActions" :key="action.id">
            <span class="item-text">{{ action.title }}</span>
            <el-tag
              size="small"
              :type="action.priority === 'urgent' ? 'danger' : action.priority === 'high' ? 'warning' : 'info'"
              effect="light"
              round
            >{{ action.priority }}</el-tag>
          </div>
        </div>
        <div v-else-if="data" class="card-empty">暂无行动项</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'

const data = ref<any>(null)

const stats = computed(() => {
  if (!data.value) return []
  const o = data.value.overview
  return [
    { label: '活跃议题', value: o.activeIssues, icon: '📊' },
    { label: '待决策', value: o.pendingDecisions, icon: '🎯' },
    { label: '进行中行动', value: o.openActions, icon: '⚡' },
    { label: '逾期行动', value: o.overdueActions, icon: '⏰' },
    { label: '证据总量', value: o.evidenceTotal, icon: '📄' },
    { label: '近期洞察', value: o.recentInsights, icon: '💡' },
  ]
})

onMounted(async () => {
  try {
    const res = await apiClient.get('/api/dashboard')
    data.value = res.data.data
  } catch (err) {
    console.error('Failed to load dashboard', err)
  }
})
</script>

<style scoped lang="less">
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
}

.welcome-banner {
  padding: 36px 40px;
  background: @gradient-hero;
  border-radius: @radius-xl;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  color: #fff;

  .welcome-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .welcome-desc {
    font-size: 15px;
    opacity: 0.8;
  }

  .welcome-art {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);

    .art-circle {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.15);
    }

    .c1 { width: 120px; height: 120px; top: -60px; right: 0; background: rgba(255, 255, 255, 0.05); }
    .c2 { width: 80px; height: 80px; top: -20px; right: 80px; background: rgba(255, 255, 255, 0.08); }
    .c3 { width: 50px; height: 50px; top: -10px; right: 30px; background: rgba(255, 255, 255, 0.1); }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: @transition-base;

  &:hover {
    transform: translateY(-2px);
    box-shadow: @shadow-md;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: @radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  &.stat-0 .stat-icon { background: #e0e7ff; }
  &.stat-1 .stat-icon { background: #fef3c7; }
  &.stat-2 .stat-icon { background: #d1fae5; }
  &.stat-3 .stat-icon { background: #fee2e2; }
  &.stat-4 .stat-icon { background: #e0f2fe; }
  &.stat-5 .stat-icon { background: #f3e8ff; }

  .stat-value {
    font-size: 24px;
    font-weight: 800;
    color: @text-primary;
    letter-spacing: -0.5px;
  }

  .stat-label {
    font-size: 12px;
    color: @text-tertiary;
    font-weight: 600;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.dash-card {
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  padding: 24px;
  transition: @transition-base;

  &:hover {
    box-shadow: @shadow-md;
  }

  .card-header h3 {
    font-size: 16px;
    font-weight: 700;
    color: @text-primary;
    margin-bottom: 16px;
  }
}

.card-list {
  .list-item {
    padding: 10px 0;
    border-bottom: 1px solid @border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;

    &:last-child { border-bottom: none; }

    .item-text { color: @text-primary; }

    .item-link {
      color: @primary-color;
      font-weight: 600;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}

.card-empty {
  text-align: center;
  padding: 24px;
  color: @text-tertiary;
  font-size: 14px;
}
</style>
