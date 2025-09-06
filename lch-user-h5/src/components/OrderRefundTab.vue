<template>
  <div class="order-refund-tab">
    <!-- 退款须知 -->
    <div class="refund-notice">
      <h3>退款须知</h3>
      <ul>
        <li>退款申请提交后，我们将在1-3个工作日内处理</li>
        <li>退款金额将原路返回到您的支付账户</li>
        <li>微信支付退款1-7个工作日到账</li>
        <li>余额支付退款会立即返回到您的余额账户</li>
      </ul>
    </div>

    <!-- 退款表单 -->
    <div class="refund-form">
      <van-form @submit="handleSubmit">
        <van-field
          v-model="refundForm.reason"
          name="reason"
          label="退款原因"
          placeholder="请选择退款原因"
          readonly
          is-link
          @click="showReasonPicker = true"
          :rules="[{ required: true, message: '请选择退款原因' }]"
        />
        
        <van-field
          v-model="refundForm.description"
          name="description"
          label="问题描述"
          type="textarea"
          placeholder="请详细描述遇到的问题（选填）"
          rows="3"
          maxlength="200"
          show-word-limit
        />

        <div class="refund-amount">
          <div class="amount-item">
            <span class="label">退款金额</span>
            <span class="amount">¥{{ order.payAmount.toFixed(2) }}</span>
          </div>
          <div class="amount-note">
            <van-icon name="info-o" />
            <span>将退还您的实际支付金额</span>
          </div>
        </div>

        <div class="submit-section">
          <van-button 
            type="primary" 
            size="large" 
            block
            native-type="submit"
            :loading="isSubmitting"
          >
            提交退款申请
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 退款原因选择弹窗 -->
    <van-popup 
      v-model:show="showReasonPicker"
      position="bottom"
      round
    >
      <van-picker
        :columns="reasonOptions"
        @confirm="onReasonConfirm"
        @cancel="showReasonPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { Order } from '@/types'
import type { RefundParams } from '@/api/orders'
import { Toast } from 'vant'

interface Props {
  order: Order
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submitRefund: [params: RefundParams]
}>()

const isSubmitting = ref(false)
const showReasonPicker = ref(false)

const refundForm = reactive({
  reason: '',
  description: ''
})

// 退款原因选项
const reasonOptions = [
  { text: '设备故障无法使用', value: '设备故障无法使用' },
  { text: '服务效果不满意', value: '服务效果不满意' },
  { text: '误操作下单', value: '误操作下单' },
  { text: '设备占用无法使用', value: '设备占用无法使用' },
  { text: '等待时间过长', value: '等待时间过长' },
  { text: '门店环境问题', value: '门店环境问题' },
  { text: '其他原因', value: '其他原因' }
]

// 选择退款原因
const onReasonConfirm = ({ selectedOptions }: any) => {
  refundForm.reason = selectedOptions[0].text
  showReasonPicker.value = false
}

// 提交退款申请
const handleSubmit = async () => {
  if (!refundForm.reason) {
    Toast.fail('请选择退款原因')
    return
  }

  try {
    isSubmitting.value = true
    
    const params: RefundParams = {
      orderId: props.order.id,
      reason: refundForm.reason,
      description: refundForm.description || undefined
    }
    
    emit('submitRefund', params)
  } catch (error) {
    console.error('提交退款申请失败:', error)
    Toast.fail('提交失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.order-refund-tab {
  padding: 16px;
}

.refund-notice {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.refund-notice h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px;
}

.refund-notice ul {
  margin: 0;
  padding-left: 16px;
}

.refund-notice li {
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
  margin-bottom: 8px;
}

.refund-notice li:last-child {
  margin-bottom: 0;
}

.refund-form {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.refund-amount {
  padding: 16px 0;
  border-top: 1px solid #ebedf0;
  border-bottom: 1px solid #ebedf0;
  margin: 16px 0;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.amount-item .label {
  font-size: 16px;
  color: #323233;
  font-weight: 600;
}

.amount-item .amount {
  font-size: 18px;
  color: #ee0a24;
  font-weight: 600;
}

.amount-note {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #969799;
}

.amount-note .van-icon {
  margin-right: 4px;
}

.submit-section {
  margin-top: 24px;
}
</style>