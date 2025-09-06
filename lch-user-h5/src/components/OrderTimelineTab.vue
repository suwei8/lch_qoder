<template>
  <div class="order-timeline-tab">
    <div v-if="timeline.length === 0" class="empty-timeline">
      <van-empty description="暂无进度信息" />
    </div>
    
    <div v-else class="timeline-container">
      <div 
        v-for="(item, index) in timeline" 
        :key="item.id"
        class="timeline-item"
        :class="{ 'is-first': index === 0 }"
      >
        <div class="timeline-dot" :class="getStatusClass(item.status)">
          <van-icon :name="getStatusIcon(item.status)" />
        </div>
        
        <div class="timeline-content">
          <div class="timeline-header">
            <h4>{{ item.title }}</h4>
            <span class="timeline-time">{{ formatDateTime(item.createdAt) }}</span>
          </div>
          
          <div v-if="item.description" class="timeline-description">
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderTimeline } from '@/api/orders'
import { formatDateTime } from '@/utils/date'

interface Props {
  timeline: OrderTimeline[]
}

defineProps<Props>()

// 获取状态图标
const getStatusIcon = (status: string) => {
  const iconMap = {
    created: 'add-o',
    paid: 'success',
    using: 'play-circle-o',
    completed: 'checked',
    cancelled: 'cross',
    refund_requested: 'refund-o',
    refund_approved: 'success',
    refund_rejected: 'cross',
    refunded: 'success'
  }
  return iconMap[status as keyof typeof iconMap] || 'info-o'
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  const classMap = {
    created: 'status-created',
    paid: 'status-success',
    using: 'status-using',
    completed: 'status-success',
    cancelled: 'status-cancelled',
    refund_requested: 'status-warning',
    refund_approved: 'status-success',
    refund_rejected: 'status-cancelled',
    refunded: 'status-success'
  }
  return classMap[status as keyof typeof classMap] || 'status-default'
}
</script>

<style scoped>
.order-timeline-tab {
  padding: 16px;
}

.empty-timeline {
  padding: 40px 0;
}

.timeline-container {
  position: relative;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: #ebedf0;
}

.timeline-item {
  position: relative;
  padding-left: 52px;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: white;
  border: 2px solid #ebedf0;
  z-index: 1;
}

.status-created {
  border-color: #969799;
  color: #969799;
}

.status-success {
  border-color: #07c160;
  color: #07c160;
  background: #f0f9ff;
}

.status-using {
  border-color: #1989fa;
  color: #1989fa;
  background: #e8f4ff;
}

.status-warning {
  border-color: #ff9500;
  color: #ff9500;
  background: #fff7e6;
}

.status-cancelled {
  border-color: #ee0a24;
  color: #ee0a24;
  background: #ffeef0;
}

.status-default {
  border-color: #c8c9cc;
  color: #c8c9cc;
}

.timeline-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.timeline-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
}

.timeline-time {
  font-size: 12px;
  color: #969799;
  flex-shrink: 0;
  margin-left: 12px;
}

.timeline-description {
  margin-top: 8px;
}

.timeline-description p {
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
  margin: 0;
}

.is-first .timeline-dot {
  border-color: #1989fa;
  color: #1989fa;
  background: #e8f4ff;
}
</style>