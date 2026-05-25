<template>
  <div class="kpi-card">
    <div class="kpi-content">
      <div class="kpi-info">
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-value">{{ formattedValue }}</div>
        <div class="kpi-link" :class="{ 'growth-positive': growthRate !== null && growthRate !== undefined }">
          <span v-if="growthRate !== null && growthRate !== undefined">↑+{{ growthRate }}%</span>
          <span v-else-if="linkText">{{ linkText }}</span>
          <!-- <span v-else>--</span> -->
        </div>
      </div>
      <div class="kpi-icon">
        <el-icon :size="32" :color="iconColor">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  // 标签
  label: string
  // 数值
  value: number | null | undefined
  // 增长率（可选）
  growthRate?: number | null
  // 链接文本（可选，当没有增长率时显示）
  linkText?: string
  // 图标组件
  icon: Component
  // 图标颜色
  iconColor?: string
  // 是否显示货币符号
  showCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#409EFF',
  showCurrency: false,
  growthRate: null,
  linkText: ''
})

// 格式化数字（千分位），无数据返回--
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '--'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化后的值
const formattedValue = computed(() => {
  const formatted = formatNumber(props.value)
  return props.showCurrency && formatted !== '--' ? `¥${formatted}` : formatted
})
</script>

<style scoped>
.kpi-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 120px;
  display: flex;
  align-items: center;
}

.kpi-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.kpi-info {
  flex: 1;
  min-width: 0; /* 允许内容收缩 */
  overflow: hidden; /* 防止内容溢出 */
}

.kpi-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  word-break: break-all; /* 允许长数字换行 */
  overflow-wrap: break-word; /* 允许单词内换行 */
  line-height: 1.2; /* 减小行高 */
}

.kpi-link {
  font-size: 12px;
  color: #909399;
}

.kpi-link.growth-positive {
  color: #67C23A;
}

.kpi-icon {
  margin-left: 20px;
  flex-shrink: 0; /* 防止图标被压缩 */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

