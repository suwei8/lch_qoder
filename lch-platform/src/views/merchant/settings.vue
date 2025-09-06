<template>
  <div class="page-container">
    <el-card class="page-header" shadow="never">
      <h2>商户设置</h2>
      <p>商户基本信息、门店管理、员工账号、系统配置</p>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px;">
      <!-- 基本信息 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>商户基本信息</span>
          </template>
          
          <el-form :model="merchantInfo" label-width="100px" label-position="left">
            <el-form-item label="商户名称">
              <el-input v-model="merchantInfo.name" />
            </el-form-item>
            
            <el-form-item label="联系电话">
              <el-input v-model="merchantInfo.phone" />
            </el-form-item>
            
            <el-form-item label="营业地址">
              <el-input v-model="merchantInfo.address" type="textarea" :rows="2" />
            </el-form-item>
            
            <el-form-item label="营业时间">
              <el-time-picker
                v-model="merchantInfo.businessHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
              />
            </el-form-item>
            
            <el-form-item label="客服电话">
              <el-input v-model="merchantInfo.servicePhone" />
            </el-form-item>
            
            <el-form-item label="商户Logo">
              <el-upload
                class="logo-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="merchantInfo.logo" :src="merchantInfo.logo" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveMerchantInfo">保存信息</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 员工管理 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>员工账号管理</span>
              <el-button type="primary" size="small" @click="addStaff">
                <el-icon><Plus /></el-icon>
                添加员工
              </el-button>
            </div>
          </template>
          
          <div v-for="staff in staffList" :key="staff.id" class="staff-item">
            <div class="staff-info">
              <div class="staff-basic">
                <h4>{{ staff.name }}</h4>
                <p>{{ staff.phone }}</p>
              </div>
              <div class="staff-role">
                <el-tag :type="staff.role === 'admin' ? 'danger' : 'primary'" size="small">
                  {{ staff.role === 'admin' ? '店长' : '店员' }}
                </el-tag>
              </div>
            </div>
            <div class="staff-actions">
              <el-button size="small" @click="editStaff(staff)">编辑</el-button>
              <el-button 
                v-if="staff.role !== 'admin'"
                size="small" 
                type="danger" 
                @click="removeStaff(staff)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统配置 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <span>系统配置</span>
      </template>
      
      <el-row :gutter="24">
        <el-col :span="8">
          <el-card shadow="never" class="config-card">
            <h4>洗车定价配置</h4>
            <el-form label-width="80px">
              <el-form-item label="标准洗车">
                <el-input-number v-model="pricingConfig.standard" :min="1" :precision="2" />
                <span style="margin-left: 8px;">元</span>
              </el-form-item>
              <el-form-item label="精洗服务">
                <el-input-number v-model="pricingConfig.premium" :min="1" :precision="2" />
                <span style="margin-left: 8px;">元</span>
              </el-form-item>
              <el-form-item label="泡沫洗车">
                <el-input-number v-model="pricingConfig.foam" :min="1" :precision="2" />
                <span style="margin-left: 8px;">元</span>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card shadow="never" class="config-card">
            <h4>设备管理配置</h4>
            <el-form label-width="80px">
              <el-form-item label="维护提醒">
                <el-switch v-model="deviceConfig.maintenanceAlert" />
              </el-form-item>
              <el-form-item label="故障通知">
                <el-switch v-model="deviceConfig.faultNotification" />
              </el-form-item>
              <el-form-item label="缺液提醒">
                <el-switch v-model="deviceConfig.lowLiquidAlert" />
              </el-form-item>
              <el-form-item label="自动重启">
                <el-switch v-model="deviceConfig.autoRestart" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card shadow="never" class="config-card">
            <h4>通知设置</h4>
            <el-form label-width="80px">
              <el-form-item label="订单通知">
                <el-switch v-model="notificationConfig.orderNotification" />
              </el-form-item>
              <el-form-item label="收入提醒">
                <el-switch v-model="notificationConfig.revenueAlert" />
              </el-form-item>
              <el-form-item label="系统消息">
                <el-switch v-model="notificationConfig.systemMessage" />
              </el-form-item>
              <el-form-item label="营销推送">
                <el-switch v-model="notificationConfig.marketingPush" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
      
      <div style="text-align: center; margin-top: 24px;">
        <el-button type="primary" size="large" @click="saveAllConfig">保存全部配置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface MerchantInfo {
  name: string;
  phone: string;
  address: string;
  businessHours: [string, string] | null;
  servicePhone: string;
  logo: string;
}

interface Staff {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'staff';
}

interface PricingConfig {
  standard: number;
  premium: number;
  foam: number;
}

interface DeviceConfig {
  maintenanceAlert: boolean;
  faultNotification: boolean;
  lowLiquidAlert: boolean;
  autoRestart: boolean;
}

interface NotificationConfig {
  orderNotification: boolean;
  revenueAlert: boolean;
  systemMessage: boolean;
  marketingPush: boolean;
}

// 商户基本信息
const merchantInfo = ref<MerchantInfo>({
  name: '测试洗车店',
  phone: '13900139001',
  address: '北京市朝阳区某某街道123号',
  businessHours: ['08:00', '22:00'],
  servicePhone: '400-123-4567',
  logo: '',
});

// 员工列表
const staffList = ref<Staff[]>([
  { id: 1, name: '张店长', phone: '13900139001', role: 'admin' },
  { id: 2, name: '李师傅', phone: '13900139011', role: 'staff' },
  { id: 3, name: '王小二', phone: '13900139012', role: 'staff' },
]);

// 定价配置
const pricingConfig = ref<PricingConfig>({
  standard: 15.00,
  premium: 25.00,
  foam: 20.00,
});

// 设备配置
const deviceConfig = ref<DeviceConfig>({
  maintenanceAlert: true,
  faultNotification: true,
  lowLiquidAlert: true,
  autoRestart: false,
});

// 通知配置
const notificationConfig = ref<NotificationConfig>({
  orderNotification: true,
  revenueAlert: true,
  systemMessage: true,
  marketingPush: false,
});

const beforeLogoUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error('Logo 只能是 JPG/PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('Logo 大小不能超过 2MB!');
  }
  return isJPG && isLt2M;
};

const saveMerchantInfo = () => {
  ElMessage.success('商户信息保存成功');
};

const addStaff = () => {
  ElMessage.info('添加员工功能开发中');
};

const editStaff = (staff: Staff) => {
  ElMessage.info(`编辑员工：${staff.name}`);
};

const removeStaff = async (staff: Staff) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除员工 ${staff.name} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const index = staffList.value.findIndex(s => s.id === staff.id);
    if (index > -1) {
      staffList.value.splice(index, 1);
      ElMessage.success('删除成功');
    }
  } catch {
    // 用户取消操作
  }
};

const saveAllConfig = () => {
  ElMessage.success('配置保存成功');
};
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.logo-uploader .logo {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
}

.logo-uploader .logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-uploader:hover .logo-uploader-icon {
  border-color: #52c41a;
  color: #52c41a;
}

.staff-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.staff-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.staff-basic h4 {
  margin: 0 0 4px 0;
  color: #333;
}

.staff-basic p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.staff-actions {
  text-align: right;
}

.config-card {
  border: 1px solid #e8e8e8;
}

.config-card h4 {
  margin: 0 0 16px 0;
  color: #333;
  text-align: center;
}
</style>