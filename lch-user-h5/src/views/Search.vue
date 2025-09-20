<template>
  <div class="search-container">
    <!-- 搜索栏 -->
    <div class="search-header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索门店名称或地址"
        @search="handleSearch"
        @clear="handleClear"
        @cancel="goBack"
        show-action
        autofocus
      />
    </div>

    <!-- 搜索历史 -->
    <div class="search-history" v-if="!searchKeyword && searchHistory.length > 0">
      <div class="history-header">
        <h3 class="history-title">搜索历史</h3>
        <van-button 
          type="default" 
          size="mini"
          @click="clearHistory"
        >
          清空
        </van-button>
      </div>
      <div class="history-tags">
        <van-tag 
          v-for="(item, index) in searchHistory" 
          :key="index"
          type="default"
          @click="searchHistoryItem(item)"
          class="history-tag"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div class="hot-search" v-if="!searchKeyword">
      <h3 class="hot-title">热门搜索</h3>
      <div class="hot-tags">
        <van-tag 
          v-for="(item, index) in hotSearches" 
          :key="index"
          type="primary"
          @click="searchHotItem(item)"
          class="hot-tag"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" v-if="searchKeyword">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 门店结果 -->
          <div class="result-section" v-if="storeResults.length > 0">
            <h3 class="section-title">门店 ({{ storeResults.length }})</h3>
            <div class="store-list">
              <div 
                v-for="store in storeResults" 
                :key="store.id"
                class="store-item"
                @click="goToStoreDetail(store.id)"
              >
                <div class="store-image">
                  <van-image
                    :src="store.image"
                    fit="cover"
                    :alt="store.name"
                  />
                </div>
                
                <div class="store-info">
                  <h4 class="store-name" v-html="highlightKeyword(store.name)"></h4>
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
                  <div class="store-address" v-html="highlightKeyword(store.address)"></div>
                  <div class="store-meta">
                    <span class="distance">{{ store.distance }}</span>
                    <span class="price">起 ¥{{ store.minPrice }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty 
            v-if="!loading && searchKeyword && storeResults.length === 0"
            description="未找到相关门店"
            image="search"
          >
            <van-button 
              type="primary" 
              size="small"
              @click="handleClear"
            >
              重新搜索
            </van-button>
          </van-empty>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchStores as searchStoresApi } from '@/api/store'
import type { Store } from '@/types'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const storeResults = ref<Store[]>([])
const searchHistory = ref<string[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)

// 热门搜索
const hotSearches = ref([
  '24小时洗车',
  '自助洗车',
  '精洗服务',
  '附近门店',
  '优惠活动',
  '会员专享'
])

// 搜索门店
const searchStores = async (reset = false) => {
  if (!searchKeyword.value.trim()) return

  if (reset) {
    currentPage.value = 1
    finished.value = false
    storeResults.value = []
  }

  try {
    const response = await searchStoresApi({
      keyword: searchKeyword.value,
      page: currentPage.value,
      limit: 10
    })

    const newStores = response.data.map((store: any) => ({
      ...store,
      image: store.image || '/images/store-default.jpg',
      distance: `${(store.distance / 1000).toFixed(1)}km`,
      rating: store.rating || 4.5,
      reviewCount: store.reviewCount || 0,
      minPrice: store.minPrice || 15
    }))

    if (reset) {
      storeResults.value = newStores
    } else {
      storeResults.value.push(...newStores)
    }

    if (newStores.length < 10) {
      finished.value = true
    }

    currentPage.value++
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return

  // 添加到搜索历史
  addToHistory(searchKeyword.value)
  
  // 执行搜索
  searchStores(true)
}

// 清除搜索
const handleClear = () => {
  searchKeyword.value = ''
  storeResults.value = []
  finished.value = false
}

// 下拉刷新
const onRefresh = async () => {
  await searchStores(true)
  refreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  await searchStores()
  loading.value = false
}

// 搜索历史项
const searchHistoryItem = (item: string) => {
  searchKeyword.value = item
  handleSearch()
}

// 搜索热门项
const searchHotItem = (item: string) => {
  searchKeyword.value = item
  handleSearch()
}

// 添加到搜索历史
const addToHistory = (keyword: string) => {
  const trimmed = keyword.trim()
  if (!trimmed) return

  // 移除重复项
  const index = searchHistory.value.indexOf(trimmed)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }

  // 添加到开头
  searchHistory.value.unshift(trimmed)

  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }

  // 保存到本地存储
  localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
}

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('search_history')
}

// 高亮关键词
const highlightKeyword = (text: string) => {
  if (!searchKeyword.value.trim()) return text
  
  const keyword = searchKeyword.value.trim()
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 跳转到门店详情
const goToStoreDetail = (storeId: number) => {
  router.push(`/store/${storeId}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('search_history')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
  }
}

// 组件挂载
onMounted(() => {
  loadSearchHistory()
})
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.search-header {
  background: white;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 搜索历史 */
.search-history {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  cursor: pointer;
}

/* 热门搜索 */
.hot-search {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.hot-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 0;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
}

/* 搜索结果 */
.search-results {
  padding: 16px;
}

.result-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 0;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-item {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.store-item:active {
  transform: scale(0.98);
}

.store-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.store-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.store-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 6px 0;
}

.store-rating {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.rating-text {
  margin-left: 4px;
  font-size: 10px;
  color: #969799;
}

.store-address {
  font-size: 12px;
  color: #646566;
  margin-bottom: 6px;
}

.store-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distance {
  font-size: 10px;
  color: #969799;
}

.price {
  font-size: 12px;
  font-weight: 600;
  color: #ee0a24;
}

/* 高亮样式 */
:deep(.highlight) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}
</style>