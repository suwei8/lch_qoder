<template>
  <div class="feedback-page">
    <van-nav-bar
      title="意见反馈"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="feedback-content">
      <van-form @submit="handleSubmit">
        <van-field
          v-model="formData.type"
          name="type"
          label="反馈类型"
          placeholder="请选择反馈类型"
          readonly
          is-link
          @click="showTypePicker = true"
          :rules="[{ required: true, message: '请选择反馈类型' }]"
        />

        <van-field
          v-model="formData.content"
          name="content"
          label="反馈内容"
          type="textarea"
          placeholder="请详细描述您遇到的问题或建议"
          rows="5"
          maxlength="500"
          show-word-limit
          :rules="[{ required: true, message: '请输入反馈内容' }]"
        />

        <van-field
          v-model="formData.contact"
          name="contact"
          label="联系方式"
          placeholder="请输入您的联系方式（选填）"
        />

        <div class="submit-section">
          <van-button 
            type="primary" 
            size="large" 
            block
            native-type="submit"
            :loading="isSubmitting"
          >
            提交反馈
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 类型选择弹窗 -->
    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker
        :columns="typeOptions"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'

const router = useRouter()
const isSubmitting = ref(false)
const showTypePicker = ref(false)

const formData = reactive({
  type: '',
  content: '',
  contact: ''
})

const typeOptions = [
  { text: '功能建议', value: 'suggestion' },
  { text: '问题反馈', value: 'bug' },
  { text: '服务投诉', value: 'complaint' },
  { text: '其他', value: 'other' }
]

const onTypeConfirm = ({ selectedOptions }: any) => {
  formData.type = selectedOptions[0].text
  showTypePicker.value = false
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    Toast.success('反馈提交成功，感谢您的建议！')
    router.back()
  } catch (error) {
    console.error('提交反馈失败:', error)
    Toast.fail('提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.feedback-content {
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