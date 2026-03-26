<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <h3>紧急决策</h3>
        <p class="text-secondary" v-if="!data">加载中...</p>
        <ul v-if="data?.urgentDecisions?.length">
          <li v-for="d in data.urgentDecisions" :key="d.id">
            {{ d.recommendation?.slice(0, 60) }}... (置信度: {{ (d.confidence * 100).toFixed(0) }}%)
          </li>
        </ul>
      </div>
      <div class="card">
        <h3>我的议题</h3>
        <ul v-if="data?.myWorkItems?.ownedIssues?.length">
          <li v-for="issue in data.myWorkItems.ownedIssues" :key="issue.id">
            <router-link :to="`/issues/${issue.id}`">{{ issue.title }}</router-link>
            <span class="badge">{{ issue.status }}</span>
          </li>
        </ul>
      </div>
      <div class="card">
        <h3>我的行动项</h3>
        <ul v-if="data?.myWorkItems?.assignedActions?.length">
          <li v-for="action in data.myWorkItems.assignedActions" :key="action.id">
            {{ action.title }}
            <span class="badge" :class="action.priority">{{ action.priority }}</span>
          </li>
        </ul>
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
    { label: '活跃议题', value: o.activeIssues },
    { label: '待决策', value: o.pendingDecisions },
    { label: '进行中行动', value: o.openActions },
    { label: '逾期行动', value: o.overdueActions },
    { label: '证据总量', value: o.evidenceTotal },
    { label: '近期洞察', value: o.recentInsights },
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

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.stat-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.card h3 { font-size: 16px; margin-bottom: 12px; }
.card ul { list-style: none; padding: 0; }
.card li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.badge.urgent { background: #fff1f0; color: #f5222d; }
.badge.high { background: #fff7e6; color: #fa8c16; }
</style>
