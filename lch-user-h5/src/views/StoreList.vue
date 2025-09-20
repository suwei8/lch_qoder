<template>
  <div class="store-list-container">
    <!-- 导航栏 -->
    <van-nav-bar title="门店列表" left-arrow @click-left="goBack" />

    <!-- 搜索和筛选 -->
    <div class="search-filter-bar">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索门店名称"
        @search="handleSearch"
        @clear="handleClear"
      />
      <van-button 
        type="default" 
        size="small" 
        @click="showFilter = true"
        class="filter-btn"
      >
        <van-icon name="filter-o" />
        筛选
      </van-button>
    </div>

    <!-- 门店列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="store-list">
          <div 
            v-for="store in storeList" 
            :key="store.id"
            class="store-card"
            @click="goToStoreDetail(store.id)"
          >
            <div class="store-image">
              <van-image
                :src="store.image"
                fit="cover"
                :alt="store.name"
              />
              <div class="store-status" :class="store.status">
                {{ store.statusText }}
              </div>
            </div>
            
            <div class="store-info">
              <h3 class="store-name">{{ store.name }}</h3>
              <div class="store-rating">
                <van-rate 
                  v-model="store.rating" 
                  :size="12" 
                  readonly 
                  color="#ffd21e" 
                  void-color="#eee"
                />
                <span class="rating-text">({{ store.reviewCount }})</span>
              </div>
              <div class="store-address">
                <van-icon name="location-o" />
                <span>{{ store.address }}</span>
              </div>
              <div class="store-meta">
                <span class="distance">{{ store.distance }}</span>
                <span class="price">起 ¥{{ store.minPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 筛选弹窗 -->
    <van-popup 
      v-model:show="showFilter" 
      position="bottom" 
      :style="{ height: '60%' }"
      round
    >
      <div class="filter-popup">
        <div class="filter-header">
          <h3>筛选条件</h3>
          <van-button type="primary" size="small" @click="applyFilter">
            确定
          </van-button>
        </div>
        
        <div class="filter-content">
          <div class="filter-section">
            <h4>距离</h4>
            <van-radio-group v-model="filterOptions.distance">
              <van-radio name="all">不限</van-radio>
              <van-radio name="1">1km内</van-radio>
              <van-radio name="3">3km内</van-radio>
              <van-radio name="5">5km内</van-radio>
            </van-radio-group>
          </div>
          
          <div class="filter-section">
            <h4>价格</h4>
            <van-radio-group v-model="filterOptions.price">
              <van-radio name="all">不限</van-radio>
              <van-radio name="low">¥15以下</van-radio>
              <van-radio name="medium">¥15-25</van-radio>
              <van-radio name="high">¥25以上</van-radio>
            </van-radio-group>
          </div>
          
          <div class="filter-section">
            <h4>营业状态</h4>
            <van-radio-group v-model="filterOptions.status">
              <van-radio name="all">不限</van-radio>
              <van-radio name="active">营业中</van-radio>
            </van-radio-group>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStoreList } from '@/api/store'
import type { Store } from '@/types'

const router = useRouter()

// 响应式数据
const storeList = ref<Store[]>([])
const searchKeyword = ref('')
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showFilter = ref(false)
const currentPage = ref(1)

const filterOptions = ref({
  distance: 'all',
  price: 'all',
  status: 'all'
})

// 加载门店列表
const loadStores = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    finished.value = false
    storeList.value = []
  }

  try {
    const response = await getStoreList({
      page: currentPage.value,
      limit: 10,
      // keyword: searchKeyword.value,
      ...filterOptions.value
    })

    const newStores = response.data.map((store: any) => ({
      ...store,
      image: store.image || '/images/store-default.jpg',
      statusText: store.status === 'active' ? '营业中' : '已打烊',
      distance: `${(store.distance / 1000).toFixed(1)}km`,
      rating: store.rating || 4.5,
      reviewCount: store.reviewCount || 0,
      minPrice: store.minPrice || 15
    }))

    if (reset) {
      storeList.value = newStores
    } else {
      storeList.value.push(...newStores)
    }

    if (newStores.length < 10) {
      finished.value = true
    }

    currentPage.value++
  } catch (error) {
    console.error('加载门店列表失败:', error)
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadStores(true)
  refreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  await loadStores()
  loading.value = false
}

// 搜索
const handleSearch = () => {
  loadStores(true)
}

// 清除搜索
const handleClear = () => {
  searchKeyword.value = ''
  loadStores(true)
}

// 应用筛选
const applyFilter = () => {
  showFilter.value = false
  loadStores(true)
}

// 跳转到门店详情
const goToStoreDetail = (storeId: number) => {
  router.push(`/store/${storeId}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载
onMounted(() => {
  loadStores(true)
})
</script>

<style scoped>
.store-list-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.search-filter-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  gap: 12px;
}

.search-filter-bar .van-search {
  flex: 1;
}

.filter-btn {
  flex-shrink: 0;
}

.store-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-card {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.store-card:active {
  transform: scale(0.98);
}

.store-image {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.store-status {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  color: white;
  background: #07c160;
}

.store-status.inactive {
  background: #ee0a24;
}

.store-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px 0;
}

.store-rating {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.rating-text {
  margin-left: 4px;
  font-size: 12px;
  color: #969799;
}

.store-address {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.store-address .van-icon {
  margin-right: 4px;
}

.store-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distance {
  font-size: 12px;
  color: #969799;
}

.price {
  font-size: 14px;
  font-weight: 600;
  color: #ee0a24;
}

/* 筛选弹窗 */
.filter-popup {
  padding: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #323233;
}

.filter-section .van-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>