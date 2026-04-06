<template>
  <div class="list-controls">
    <div class="search-bar">
      <el-input
        :model-value="search"
        placeholder="搜索议题标题或描述..."
        :prefix-icon="Search"
        clearable
        size="large"
        @update:model-value="emit('update:search', $event)"
        @input="emit('search')"
      />
    </div>

    <div class="filter-options">
      <el-select
        :model-value="domain"
        placeholder="领域"
        clearable
        size="large"
        @update:model-value="emit('update:domain', $event ?? '')"
      >
        <el-option
          v-for="option in ISSUE_DOMAIN_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <el-select
        :model-value="priority"
        placeholder="优先级"
        clearable
        size="large"
        @update:model-value="emit('update:priority', $event ?? '')"
      >
        <el-option
          v-for="option in ISSUE_PRIORITY_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ISSUE_DOMAIN_OPTIONS, ISSUE_PRIORITY_OPTIONS } from '../constants'

defineProps<{
  search: string
  domain: string
  priority: string
}>()

const emit = defineEmits<{
  search: []
  'update:search': [value: string]
  'update:domain': [value: string]
  'update:priority': [value: string]
}>()
</script>

<style scoped lang="less">
.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.search-bar {
  flex: 1;
  max-width: 500px;
}

.filter-options {
  display: flex;
  gap: 12px;

  .el-select {
    width: 120px;
  }
}

@media (max-width: 768px) {
  .list-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-bar {
    max-width: none;
  }
}
</style>
