<template>
  <div class="page" v-if="issue">
    <div class="page-header">
      <div>
        <h2>{{ issue.title }}</h2>
        <div class="meta">{{ issue.domain }} · {{ issue.status }} · 截止: {{ issue.decisionDueAt?.slice(0,10) }}</div>
      </div>
      <span class="badge" :class="issue.status">{{ issue.status }}</span>
    </div>
    <div class="content-grid">
      <div class="card">
        <h3>描述</h3>
        <p>{{ issue.description }}</p>
      </div>
      <div class="card">
        <h3>证据 ({{ issue.evidenceCount }})</h3>
        <p class="text-secondary">在此查看和管理关联的证据</p>
      </div>
      <div class="card">
        <h3>洞察 ({{ issue.insightCount }})</h3>
        <p class="text-secondary">AI 生成和手动创建的洞察</p>
      </div>
      <div class="card">
        <h3>决策卡 ({{ issue.decisionCardCount }})</h3>
        <p class="text-secondary">基于推理的决策建议</p>
      </div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/shared/api/client'

const route = useRoute()
const issue = ref<any>(null)

onMounted(async () => {
  const res = await apiClient.get(`/api/issues/${route.params.id}`)
  issue.value = res.data.data
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.meta { font-size: 13px; color: #999; margin-top: 4px; }
.content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.card h3 { font-size: 15px; margin-bottom: 8px; }
.badge { font-size: 12px; padding: 4px 10px; border-radius: 4px; background: #f0f0f0; }
.loading { text-align: center; padding: 60px; color: #999; }
</style>
