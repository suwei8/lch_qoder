<template>
  <div class="business-trend-chart">
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
      trigger: 'axis'
    },
    legend: {
      data: ['订单量', '收益', '用户数']
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '订单量/用户数'
      },
      {
        type: 'value',
        name: '收益(元)'
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'line',
        stack: '总量',
        data: props.data.map(item => item.orders)
      },
      {
        name: '用户数',
        type: 'line',
        stack: '总量',
        data: props.data.map(item => item.users)
      },
      {
        name: '收益',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.map(item => item.revenue)
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
.business-trend-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>