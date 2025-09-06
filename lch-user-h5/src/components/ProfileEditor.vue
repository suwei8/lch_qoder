<template>
  <div class="profile-editor">
    <!-- 头部 -->
    <div class="header">
      <h3>编辑资料</h3>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <!-- 编辑表单 -->
    <div class="editor-content">
      <van-form @submit="handleSubmit">
        <!-- 头像 -->
        <van-field name="avatar" label="头像">
          <template #input>
            <div class="avatar-section">
              <van-uploader
                v-model="fileList"
                :max-count="1"
                :preview-size="60"
                upload-text="上传头像"
                @after-read="handleAvatarUpload"
              >
                <van-image
                  :src="formData.avatar || defaultAvatar"
                  round
                  width="60"
                  height="60"
                  fit="cover"
                />
              </van-uploader>
            </div>
          </template>
        </van-field>

        <!-- 昵称 -->
        <van-field
          v-model="formData.nickname"
          name="nickname"
          label="昵称"
          placeholder="请输入昵称"
          maxlength="20"
          show-word-limit
          :rules="[{ required: true, message: '请输入昵称' }]"
        />

        <!-- 性别 -->
        <van-field
          v-model="genderText"
          name="gender"
          label="性别"
          placeholder="请选择性别"
          readonly
          is-link
          @click="showGenderPicker = true"
        />

        <!-- 生日 -->
        <van-field
          v-model="birthdayText"
          name="birthday"
          label="生日"
          placeholder="请选择生日"
          readonly
          is-link
          @click="showDatePicker = true"
        />

        <!-- 个人简介 -->
        <van-field
          v-model="formData.bio"
          name="bio"
          label="个人简介"
          type="textarea"
          placeholder="写点什么介绍自己吧"
          rows="3"
          maxlength="100"
          show-word-limit
        />

        <!-- 保存按钮 -->
        <div class="submit-section">
          <van-button 
            type="primary" 
            size="large" 
            block
            native-type="submit"
            :loading="isSubmitting"
          >
            保存
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 性别选择弹窗 -->
    <van-popup 
      v-model:show="showGenderPicker"
      position="bottom"
      round
    >
      <van-picker
        :columns="genderOptions"
        @confirm="onGenderConfirm"
        @cancel="showGenderPicker = false"
      />
    </van-popup>

    <!-- 日期选择弹窗 -->
    <van-popup 
      v-model:show="showDatePicker"
      position="bottom"
      round
    >
      <van-date-picker
        v-model="selectedDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
        :min-date="minDate"
        :max-date="maxDate"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Toast } from 'vant'

const emit = defineEmits<{
  close: []
  updated: []
}>()

const userStore = useUserStore()

const isSubmitting = ref(false)
const showGenderPicker = ref(false)
const showDatePicker = ref(false)
const fileList = ref([])
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

// 表单数据
const formData = reactive({
  avatar: '',
  nickname: '',
  gender: '',
  birthday: '',
  bio: ''
})

// 日期选择器数据
const selectedDate = ref(new Date())
const minDate = new Date('1950-01-01')
const maxDate = new Date()

// 性别选项
const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '保密', value: 'unknown' }
]

// 性别显示文本
const genderText = computed(() => {
  const option = genderOptions.find(opt => opt.value === formData.gender)
  return option?.text || '请选择性别'
})

// 生日显示文本
const birthdayText = computed(() => {
  return formData.birthday || '请选择生日'
})

// 头像上传
const handleAvatarUpload = (file: any) => {
  Toast.loading('上传中...')
  
  // 模拟上传
  setTimeout(() => {
    formData.avatar = URL.createObjectURL(file.file)
    Toast.success('上传成功')
  }, 1000)
}

// 性别选择确认
const onGenderConfirm = ({ selectedOptions }: any) => {
  formData.gender = selectedOptions[0].value
  showGenderPicker.value = false
}

// 日期选择确认
const onDateConfirm = () => {
  const year = selectedDate.value.getFullYear()
  const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
  const day = String(selectedDate.value.getDate()).padStart(2, '0')
  formData.birthday = `${year}-${month}-${day}`
  showDatePicker.value = false
}

// 提交表单
const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新用户信息
    if (userStore.user) {
      userStore.user.nickname = formData.nickname
      userStore.user.avatar = formData.avatar
    }
    
    emit('updated')
  } catch (error) {
    console.error('更新资料失败:', error)
    Toast.fail('更新失败')
  } finally {
    isSubmitting.value = false
  }
}

// 初始化数据
const initData = () => {
  if (userStore.user) {
    formData.avatar = userStore.user.avatar || ''
    formData.nickname = userStore.user.nickname || ''
    formData.gender = userStore.user.gender || ''
    formData.birthday = userStore.user.birthday || ''
    formData.bio = userStore.user.bio || ''
    
    if (formData.birthday) {
      selectedDate.value = new Date(formData.birthday)
    }
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.profile-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.header .van-icon {
  font-size: 20px;
  color: #969799;
  cursor: pointer;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.avatar-section {
  display: flex;
  align-items: center;
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

:deep(.van-uploader) {
  display: flex;
  align-items: center;
}

:deep(.van-uploader__preview) {
  margin: 0;
}

:deep(.van-uploader__upload) {
  display: none;
}
</style>