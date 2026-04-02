<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="编辑议题"
    width="600px"
    @close="handleClose"
    destroy-on-close
  >
    <p class="dialog-desc">修改议题的基本信息。</p>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="输入议题标题" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="描述议题背景和目标" />
      </el-form-item>
      <div class="form-row">
        <el-form-item label="领域" prop="domain" class="form-row-item">
          <el-select v-model="form.domain" placeholder="选择领域">
            <el-option label="品牌" value="brand" />
            <el-option label="产品" value="product" />
            <el-option label="市场" value="market" />
            <el-option label="战略" value="strategy" />
            <el-option label="运营" value="operations" />
          </el-select>
        </el-form-item>
        <el-form-item label="决策截止日期" prop="decisionDueAt" class="form-row-item">
          <el-date-picker
            v-model="form.decisionDueAt"
            type="datetime"
            placeholder="选择截止日期"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiClient } from '@/shared/api/client'

const props = defineProps<{
  modelValue: boolean
  issue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = ref({
  title: '',
  description: '',
  domain: '',
  decisionDueAt: null as Date | string | null
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择领域', trigger: 'change' }]
}

watch(() => props.modelValue, (val) => {
  if (val && props.issue) {
    form.value = {
      title: props.issue.title || '',
      description: props.issue.description || '',
      domain: props.issue.domain || '',
      decisionDueAt: props.issue.decisionDueAt ? new Date(props.issue.decisionDueAt) : null
    }
  }
})

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload: any = {
      title: form.value.title,
      description: form.value.description,
      domain: form.value.domain,
    }
    if (form.value.decisionDueAt) {
      payload.decisionDueAt = new Date(form.value.decisionDueAt).toISOString()
    }
    await apiClient.patch(`/api/issues/${props.issue.id}`, payload)
    ElMessage.success('议题更新成功')
    emit('update:modelValue', false)
    emit('saved')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '更新失败，请重试')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  formRef.value?.resetFields()
}
</script>

<style scoped lang="less">
.dialog-desc {
  color: @text-secondary;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;

  .form-row-item {
    flex: 1;
  }
}
</style>
