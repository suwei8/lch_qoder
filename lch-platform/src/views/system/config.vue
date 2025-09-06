<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 基础配置 -->
      <el-tab-pane label="基础配置" name="basic">
        <el-form :model="basicConfig" label-width="120px" style="max-width: 600px;">
          <el-form-item label="系统名称">
            <el-input v-model="basicConfig.systemName" />
          </el-form-item>
          <el-form-item label="系统版本">
            <el-input v-model="basicConfig.systemVersion" readonly />
          </el-form-item>
          <el-form-item label="客服电话">
            <el-input v-model="basicConfig.servicePhone" />
          </el-form-item>
          <el-form-item label="客服邮箱">
            <el-input v-model="basicConfig.serviceEmail" />
          </el-form-item>
          <el-form-item label="系统公告">
            <el-input v-model="basicConfig.systemNotice" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveBasicConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 支付配置 -->
      <el-tab-pane label="支付配置" name="payment">
        <el-form :model="paymentConfig" label-width="120px" style="max-width: 600px;">
          <el-form-item label="微信支付">
            <el-switch v-model="paymentConfig.wechatEnabled" />
          </el-form-item>
          <el-form-item label="支付宝">
            <el-switch v-model="paymentConfig.alipayEnabled" />
          </el-form-item>
          <el-form-item label="平台手续费">
            <el-input-number v-model="paymentConfig.platformFeeRate" :min="0" :max="100" :precision="2" />
            <span style="margin-left: 8px;">%</span>
          </el-form-item>
          <el-form-item label="最小充值金额">
            <el-input-number v-model="paymentConfig.minRechargeAmount" :min="1" />
            <span style="margin-left: 8px;">元</span>
          </el-form-item>
          <el-form-item label="最大充值金额">
            <el-input-number v-model="paymentConfig.maxRechargeAmount" :min="1" />
            <span style="margin-left: 8px;">元</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="savePaymentConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 设备配置 -->
      <el-tab-pane label="设备配置" name="device">
        <el-form :model="deviceConfig" label-width="120px" style="max-width: 600px;">
          <el-form-item label="默认洗车价格">
            <el-input-number v-model="deviceConfig.defaultPrice" :min="0" :precision="2" />
            <span style="margin-left: 8px;">元/分钟</span>
          </el-form-item>
          <el-form-item label="最小使用时长">
            <el-input-number v-model="deviceConfig.minDuration" :min="1" />
            <span style="margin-left: 8px;">分钟</span>
          </el-form-item>
          <el-form-item label="最大使用时长">
            <el-input-number v-model="deviceConfig.maxDuration" :min="1" />
            <span style="margin-left: 8px;">分钟</span>
          </el-form-item>
          <el-form-item label="设备离线超时">
            <el-input-number v-model="deviceConfig.offlineTimeout" :min="1" />
            <span style="margin-left: 8px;">分钟</span>
          </el-form-item>
          <el-form-item label="自动同步间隔">
            <el-input-number v-model="deviceConfig.syncInterval" :min="1" />
            <span style="margin-left: 8px;">分钟</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveDeviceConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 短信配置 -->
      <el-tab-pane label="短信配置" name="sms">
        <el-form :model="smsConfig" label-width="120px" style="max-width: 600px;">
          <el-form-item label="短信服务商">
            <el-select v-model="smsConfig.provider" style="width: 100%;">
              <el-option label="阿里云" value="aliyun" />
              <el-option label="腾讯云" value="tencent" />
              <el-option label="华为云" value="huawei" />
            </el-select>
          </el-form-item>
          <el-form-item label="AccessKey">
            <el-input v-model="smsConfig.accessKey" show-password />
          </el-form-item>
          <el-form-item label="SecretKey">
            <el-input v-model="smsConfig.secretKey" show-password />
          </el-form-item>
          <el-form-item label="签名">
            <el-input v-model="smsConfig.signName" />
          </el-form-item>
          <el-form-item label="验证码模板">
            <el-input v-model="smsConfig.codeTemplate" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSmsConfig">保存配置</el-button>
            <el-button @click="testSms">测试短信</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 系统监控 -->
      <el-tab-pane label="系统监控" name="monitor">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card title="系统信息">
              <div class="monitor-item">
                <span class="label">服务器时间：</span>
                <span>{{ currentTime }}</span>
              </div>
              <div class="monitor-item">
                <span class="label">系统版本：</span>
                <span>{{ systemInfo.version }}</span>
              </div>
              <div class="monitor-item">
                <span class="label">Node.js版本：</span>
                <span>{{ systemInfo.nodeVersion }}</span>
              </div>
              <div class="monitor-item">
                <span class="label">运行时长：</span>
                <span>{{ systemInfo.uptime }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card title="性能监控">
              <div class="monitor-item">
                <span class="label">CPU使用率：</span>
                <el-progress :percentage="performance.cpu" />
              </div>
              <div class="monitor-item">
                <span class="label">内存使用：</span>
                <el-progress :percentage="performance.memory" />
              </div>
              <div class="monitor-item">
                <span class="label">磁盘使用：</span>
                <el-progress :percentage="performance.disk" />
              </div>
              <div class="monitor-item">
                <span class="label">网络延迟：</span>
                <span>{{ performance.latency }}ms</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

// 当前选中的标签
const activeTab = ref('basic');
const currentTime = ref('');
let timeInterval: NodeJS.Timeout;

// 基础配置
const basicConfig = reactive({
  systemName: '洗车IOT管理系统',
  systemVersion: 'v1.0.0',
  servicePhone: '400-123-4567',
  serviceEmail: 'service@washiot.com',
  systemNotice: '系统将于今晚23:00-01:00进行维护，期间可能影响正常使用。'
});

// 支付配置
const paymentConfig = reactive({
  wechatEnabled: true,
  alipayEnabled: true,
  platformFeeRate: 3.0,
  minRechargeAmount: 10,
  maxRechargeAmount: 1000
});

// 设备配置
const deviceConfig = reactive({
  defaultPrice: 1.5,
  minDuration: 3,
  maxDuration: 30,
  offlineTimeout: 5,
  syncInterval: 10
});

// 短信配置
const smsConfig = reactive({
  provider: 'aliyun',
  accessKey: '',
  secretKey: '',
  signName: '洗车IOT',
  codeTemplate: 'SMS_123456789'
});

// 系统信息
const systemInfo = reactive({
  version: 'v1.0.0',
  nodeVersion: 'v18.17.0',
  uptime: '7天 12小时'
});

// 性能监控
const performance = reactive({
  cpu: 45,
  memory: 67,
  disk: 34,
  latency: 23
});

// 更新当前时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN');
};

// 保存配置
const saveBasicConfig = () => {
  ElMessage.success('基础配置保存成功');
};

const savePaymentConfig = () => {
  ElMessage.success('支付配置保存成功');
};

const saveDeviceConfig = () => {
  ElMessage.success('设备配置保存成功');
};

const saveSmsConfig = () => {
  ElMessage.success('短信配置保存成功');
};

const testSms = () => {
  ElMessage.success('短信测试发送成功');
};

// 初始化
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.monitor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.monitor-item .label {
  font-weight: 500;
  color: #666;
}

.el-progress {
  flex: 1;
  margin-left: 12px;
}
</style>