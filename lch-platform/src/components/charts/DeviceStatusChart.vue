<template>
  <div class="device-status-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts';

// 定义属性
const props = defineProps<{
  data: any[];
  title?: string;
}>();

// 响应式数据
const chartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    updateChart();
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance || !props.data) return;

  const option = getChartOption();
  chartInstance.setOption(option, true);
};

// 获取图表配置
const getChartOption = () => {
  return {
    title: {
      text: props.title || '',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: props.data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
};

// 窗口大小改变时重置图表大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 监听数据变化
watch(() => props.data, () => {
  updateChart();
}, { deep: true });

// 组件挂载时初始化图表
onMounted(() => {
  initChart();
  window.addEventListener('resize', resizeChart);
});

// 组件卸载前销毁图表
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', resizeChart);
});
</script>

<style scoped>
.device-status-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>