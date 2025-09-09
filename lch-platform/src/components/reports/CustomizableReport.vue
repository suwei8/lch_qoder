<template>
  <div class="customizable-report">
    <div class="report-filters">
      <el-form :model="filterForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="数据维度">
              <el-select v-model="filterForm.dimension" placeholder="请选择">
                <el-option
                  v-for="item in dimensions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="统计指标">
              <el-select v-model="filterForm.metric" placeholder="请选择">
                <el-option
                  v-for="item in metrics"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-button type="primary" @click="applyFilters">应用</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    
    <div class="report-content">
      <slot :filtered-data="filteredData"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

// 定义属性
const props = defineProps<{
  data: any[];
  dimensions: { label: string; value: string }[];
  metrics: { label: string; value: string }[];
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'filterChange', filters: any): void;
}>();

// 响应式数据
const filterForm = reactive({
  dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()] as [Date, Date],
  dimension: props.dimensions[0]?.value || '',
  metric: props.metrics[0]?.value || ''
});

const filteredData = ref<any[]>([]);

// 应用过滤器
const applyFilters = () => {
  // 这里应该根据过滤条件筛选数据
  // 简化实现，实际应该根据具体业务逻辑处理
  filteredData.value = props.data;
  emit('filterChange', { ...filterForm });
};

// 重置过滤器
const resetFilters = () => {
  filterForm.dateRange = [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()];
  filterForm.dimension = props.dimensions[0]?.value || '';
  filterForm.metric = props.metrics[0]?.value || '';
  filteredData.value = [...props.data];
};

// 初始化
onMounted(() => {
  filteredData.value = [...props.data];
});
</script>

<style scoped>
.customizable-report {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-filters {
  margin-bottom: 20px;
}

.report-content {
  margin-top: 20px;
}
</style>