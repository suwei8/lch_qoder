<template>
  <div class="booking-page">
    <!-- 头部 -->
    <div class="header">
      <van-nav-bar
        title="预约洗车"
        left-text="返回"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <!-- 预约表单 -->
    <div class="booking-content">
      <van-form @submit="handleSubmit">
        <!-- 选择门店 -->
        <van-field
          v-model="selectedStoreName"
          name="store"
          label="选择门店"
          placeholder="请选择门店"
          readonly
          is-link
          @click="showStorePicker = true"
          :rules="[{ required: true, message: '请选择门店' }]"
        />

        <!-- 选择服务 -->
        <van-field
          v-model="selectedServiceName"
          name="service"
          label="洗车服务"
          placeholder="请选择服务类型"
          readonly
          is-link
          @click="showServicePicker = true"
          :rules="[{ required: true, message: '请选择服务类型' }]"
        />

        <!-- 预约时间 -->
        <van-field
          v-model="selectedDateTime"
          name="datetime"
          label="预约时间"
          placeholder="请选择预约时间"
          readonly
          is-link
          @click="showDateTimePicker = true"
          :rules="[{ required: true, message: '请选择预约时间' }]"
        />

        <!-- 车牌号 -->
        <van-field
          v-model="formData.carNumber"
          name="carNumber"
          label="车牌号"
          placeholder="请输入车牌号"
          maxlength="8"
          :rules="[{ required: true, message: '请输入车牌号' }]"
        />

        <!-- 联系电话 -->
        <van-field
          v-model="formData.phone"
          name="phone"
          label="联系电话"
          placeholder="请输入联系电话"
          type="tel"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]"
        />

        <!-- 备注 -->
        <van-field
          v-model="formData.remark"
          name="remark"
          label="备注"
          type="textarea"
          placeholder="请输入备注信息（选填）"
          rows="3"
          maxlength="100"
          show-word-limit
        />

        <!-- 提交按钮 -->
        <div class="submit-section">
          <van-button 
            type="primary" 
            size="large" 
            block
            native-type="submit"
            :loading="isSubmitting"
          >
            确认预约
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 门店选择弹窗 -->
    <van-popup v-model:show="showStorePicker" position="bottom" round>
      <van-picker
        :columns="storeOptions"
        @confirm="onStoreConfirm"
        @cancel="showStorePicker = false"
      />
    </van-popup>

    <!-- 服务选择弹窗 -->
    <van-popup v-model:show="showServicePicker" position="bottom" round>
      <van-picker
        :columns="serviceOptions"
        @confirm="onServiceConfirm"
        @cancel="showServicePicker = false"
      />
    </van-popup>

    <!-- 时间选择弹窗 -->
    <van-popup v-model:show="showDateTimePicker" position="bottom" round>
      <van-date-picker
        v-model="selectedDateArray"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateTimeConfirm"
        @cancel="showDateTimePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'

const router = useRouter()

// 响应式数据
const isSubmitting = ref(false)
const showStorePicker = ref(false)
const showServicePicker = ref(false)
const showDateTimePicker = ref(false)
const selectedDate = ref(new Date())
const selectedDateArray = ref<string[]>([])

// 表单数据
const formData = reactive({
  storeId: '',
  serviceId: '',
  datetime: '',
  carNumber: '',
  phone: '',
  remark: ''
})

// 选择的数据
const selectedStore = ref<any>(null)
const selectedService = ref<any>(null)

// 计算属性
const selectedStoreName = computed(() => selectedStore.value?.text || '')
const selectedServiceName = computed(() => selectedService.value?.text || '')
const selectedDateTime = computed(() => {
  if (!formData.datetime) return ''
  return new Date(formData.datetime).toLocaleString('zh-CN')
})

// 时间限制
const minDate = new Date()
const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后

// 门店选项
const storeOptions = ref([
  { text: '市中心店', value: '1' },
  { text: '高新区店', value: '2' },
  { text: '开发区店', value: '3' }
])

// 服务选项
const serviceOptions = ref([
  { text: '标准洗车 - ¥25', value: '1' },
  { text: '精致洗车 - ¥45', value: '2' },
  { text: '豪华洗车 - ¥68', value: '3' }
])

// 门店选择确认
const onStoreConfirm = ({ selectedOptions }: any) => {
  selectedStore.value = selectedOptions[0]
  formData.storeId = selectedOptions[0].value
  showStorePicker.value = false
}

// 服务选择确认
const onServiceConfirm = ({ selectedOptions }: any) => {
  selectedService.value = selectedOptions[0]
  formData.serviceId = selectedOptions[0].value
  showServicePicker.value = false
}

// 时间选择确认
const onDateTimeConfirm = (values: string[]) => {
  const [year, month, day, hour, minute] = values
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
  selectedDate.value = date
  formData.datetime = date.toISOString()
  showDateTimePicker.value = false
}

// 提交表单
const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    Toast.success('预约成功！')
    
    // 跳转到订单页面
    router.push('/orders')
  } catch (error) {
    console.error('预约失败:', error)
    Toast.fail('预约失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.booking-content {
  padding: 16px;
}

.submit-section {
  margin-top: 32px;
  padding: 0 16px;
}

:deep(.van-form) {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.van-field) {
  padding: 16px;
}

:deep(.van-field__label) {
  width: 80px;
  color: #323233;
  font-weight: 500;
}
</style>