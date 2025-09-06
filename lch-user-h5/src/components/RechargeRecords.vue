<template>
  <div class="recharge-records">
    <!-- 导航栏 -->
    <van-nav-bar title="充值记录" left-arrow @click-left="$emit('close')" />
    
    <!-- 充值记录列表 -->
    <div class="records-content">
      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="isLoading"
          :finished="isFinished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-if="records.length === 0 && !isLoading" class="empty-state">
            <van-empty description="暂无充值记录" />
          </div>
          
          <div v-else>
            <recharge-record-item
              v-for="record in records"
              :key="record.id"
              :record="record"
              @view-detail="handleViewDetail"
            />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { rechargeApi, type RechargeRecord, type RechargeRecordParams } from '@/api/recharge'
import { Toast } from 'vant'
import RechargeRecordItem from '@/components/RechargeRecordItem.vue'

defineEmits<{
  close: []
}>()

// 状态管理
const isLoading = ref(false)
const isRefreshing = ref(false)
const isFinished = ref(false)
const records = ref<RechargeRecord[]>([])

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10
})

// 加载充值记录
const loadRecords = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      pagination.page = 1
      isFinished.value = false
    }
    
    const params: RechargeRecordParams = {
      page: pagination.page,
      size: pagination.size
    }
    
    const response = await rechargeApi.getRecords(params)
    
    if (isRefresh) {
      records.value = response.records
    } else {
      records.value.push(...response.records)
    }
    
    isFinished.value = !response.hasMore
    pagination.page++
  } catch (error) {
    console.error('加载充值记录失败:', error)
    Toast.fail('加载失败')
  }
}

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true
  await loadRecords(true)
  isRefreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  if (isRefreshing.value) return
  isLoading.value = true
  await loadRecords()
  isLoading.value = false
}

// 查看详情
const handleViewDetail = (record: RechargeRecord) => {
  // 可以添加查看详情的逻辑
  console.log('查看充值记录详情:', record)
}

onMounted(() => {
  loadRecords(true)
})
</script>

<style scoped>
.recharge-records {
  height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.records-content {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  padding: 60px 20px;
}
</style>