<template>
  <div class="page" v-if="card">
    <h2>决策卡详情</h2>
    <div class="card"><h3>建议</h3><p>{{ card.recommendation }}</p></div>
    <div class="card"><h3>置信度</h3><p>{{ (card.confidence * 100).toFixed(0) }}%</p></div>
    <div class="card"><h3>状态</h3><p>{{ card.status }}</p></div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/shared/api/client'
const route = useRoute()
const card = ref<any>(null)
onMounted(async () => {
  const res = await apiClient.get(`/api/decisions/${route.params.id}`)
  card.value = res.data.data
})
</script>

<style scoped>
.card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.card h3 { font-size: 15px; margin-bottom: 8px; }
.loading { text-align: center; padding: 60px; color: #999; }
</style>
