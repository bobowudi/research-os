<template>
  <div class="evidence-list-page">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">证据库</h2>
          <p class="page-subtitle">管理、检索并评估所有研究证据的可靠性</p>
        </div>
      </div>
      <el-button type="primary" @click="showCreate = true" :icon="Plus" size="large" class="create-btn">
        添加证据
      </el-button>
    </div>

    <div class="list-controls">
      <div class="search-bar">
        <el-input
          v-model="filters.search"
          placeholder="搜索证据标题、标签或来源..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
          size="large"
        />
      </div>
      <div class="filter-options">
        <el-select v-model="filters.sourceCategory" placeholder="来源分类" clearable @change="loadData" size="large">
          <el-option label="学术" value="academic" />
          <el-option label="行业" value="industry" />
          <el-option label="内部" value="internal" />
          <el-option label="媒体" value="media" />
        </el-select>
        <el-select v-model="filters.sourceType" placeholder="来源类型" clearable @change="loadData" size="large">
          <el-option label="报告" value="report" />
          <el-option label="论文" value="paper" />
          <el-option label="调查" value="survey" />
          <el-option label="访谈" value="interview" />
          <el-option label="文章" value="article" />
        </el-select>
      </div>
    </div>

    <div class="evidence-list-container" v-loading="loading">
      <transition-group name="list" tag="div" v-if="items.length > 0" class="evidence-list">
        <EvidenceCard
          v-for="item in items"
          :key="item.id"
          :evidence="item"
          @click="$router.push(`/evidence/${item.id}`)"
        />
      </transition-group>
      <el-empty v-else description="暂无证据数据" :image-size="160">
        <p class="empty-hint">你可以通过添加证据来开始你的研究。</p>
      </el-empty>
    </div>

    <!-- Create Evidence Dialog Placeholder -->
    <el-dialog v-model="showCreate" title="添加新证据" width="600px">
      <p class="dialog-desc">手动添加或从 URL 导入新的研究证据。</p>
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input placeholder="输入证据标题" />
        </el-form-item>
        <el-form-item label="来源 URL">
          <el-input placeholder="https://..." />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input type="textarea" :rows="3" placeholder="简要描述该证据的核心内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="showCreate = false">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Reading } from '@element-plus/icons-vue'
import { apiClient } from '@/shared/api/client'
import EvidenceCard from '../components/EvidenceCard.vue'

const items = ref<any[]>([])
const loading = ref(false)
const showCreate = ref(false)

const filters = reactive({
  sourceCategory: '',
  sourceType: '',
  search: ''
})

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.sourceCategory) params.set('sourceCategory', filters.sourceCategory)
    if (filters.sourceType) params.set('sourceType', filters.sourceType)
    if (filters.search) params.set('q', filters.search)

    const res = await apiClient.get(`/api/evidence?${params}`)
    items.value = res.data.data.items || []
  } catch (error) {
    console.error('Failed to load evidence:', error)
  } finally {
    loading.value = false
  }
}

let searchTimeout: any = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadData(), 300)
}

onMounted(loadData)
</script>

<style scoped lang="less">
.evidence-list-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon-wrap {
    width: 48px;
    height: 48px;
    background: @gradient-card-1;
    border-radius: @radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: @primary-color;
  }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    color: @text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: 14px;
    color: @text-tertiary;
  }

  .create-btn {
    height: 44px;
    padding: 0 24px;
    background: @gradient-primary;
    border: none;
    font-weight: 700;
    border-radius: @radius-md;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(99, 102, 241, 0.3);
    }
  }
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;

  .search-bar {
    flex: 1;
    max-width: 500px;
  }

  .filter-options {
    display: flex;
    gap: 12px;

    .el-select { width: 140px; }
  }
}

.evidence-list-container {
  min-height: 300px;
}

.evidence-list {
  display: flex;
  flex-direction: column;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.list-leave-to {
  opacity: 0;
}

.empty-hint {
  color: @text-tertiary;
  margin-top: 8px;
}

.dialog-desc {
  color: @text-secondary;
  margin-bottom: 20px;
}
</style>
