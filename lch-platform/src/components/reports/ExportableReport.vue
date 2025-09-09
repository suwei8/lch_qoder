<template>
  <div class="exportable-report">
    <div class="report-header">
      <h3>{{ title }}</h3>
      <div class="report-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="onDateRangeChange"
        />
        <el-button type="primary" size="small" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>
    
    <div class="report-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';

// 定义属性
const props = defineProps<{
  title: string;
  onExport?: (startDate: Date, endDate: Date) => void;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'dateRangeChange', startDate: Date, endDate: Date): void;
}>();

// 响应式数据
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]);

// 日期范围改变
const onDateRangeChange = (value: [Date, Date] | null) => {
  if (value && value[0] && value[1]) {
    emit('dateRangeChange', value[0], value[1]);
  }
};

// 导出报表
const exportReport = () => {
  if (props.onExport) {
    props.onExport(dateRange.value[0], dateRange.value[1]);
  } else {
    // 默认导出逻辑
    ElMessage.info('导出功能开发中');
  }
};
</script>

<style scoped>
.exportable-report {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-content {
  margin-top: 20px;
}
</style>