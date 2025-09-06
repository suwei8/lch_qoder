<template>
  <div class="page-container">
    <div class="page-header">
      <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/merchants' }">商户管理</el-breadcrumb-item>
        <el-breadcrumb-item>商户详情</el-breadcrumb-item>
      </el-breadcrumb>
      <h1 class="page-title">{{ merchant?.business_name || '商户详情' }}</h1>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="8">
          <el-card title="基本信息">
            <div class="info-item">
              <span class="label">商户名称：</span>
              <span>{{ merchant?.business_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系人：</span>
              <span>{{ merchant?.contact_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话：</span>
              <span>{{ merchant?.contact_phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">商户地址：</span>
              <span>{{ merchant?.business_address }}</span>
            </div>
            <div class="info-item">
              <span class="label">营业执照：</span>
              <span>{{ merchant?.business_license_number }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间：</span>
              <span>{{ formatTime(merchant?.created_at) }}</span>
            </div>
          </el-card>
        </el-col>

        <!-- 审核状态 -->
        <el-col :span="8">
          <el-card title="审核状态">
            <div class="status-card">
              <div class="status-icon" :class="`status-${merchant?.status}`">
                <el-icon v-if="merchant?.status === 'approved'"><CircleCheck /></el-icon>
                <el-icon v-else-if="merchant?.status === 'rejected'"><CircleClose /></el-icon>
                <el-icon v-else><Clock /></el-icon>
              </div>
              <div class="status-content">
                <div class="status-text">{{ getStatusText(merchant?.status) }}</div>
                <div class="status-time">{{ formatTime(merchant?.updated_at) }}</div>
              </div>
            </div>
            <div v-if="merchant?.remark" class="remark">
              <h4>审核备注</h4>
              <p>{{ merchant.remark }}</p>
            </div>
          </el-card>
        </el-col>

        <!-- 经营数据 -->
        <el-col :span="8">
          <el-card title="经营数据">
            <div class="data-item">
              <span class="data-label">设备数量</span>
              <span class="data-value">{{ businessData?.deviceCount || 0 }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">总订单数</span>
              <span class="data-value">{{ businessData?.orderCount || 0 }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">总收益</span>
              <span class="data-value text-green">¥{{ merchant?.total_revenue || 0 }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">待结算金额</span>
              <span class="data-value text-orange">¥{{ merchant?.pending_settlement || 0 }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 资质文件 -->
      <el-card title="资质文件" style="margin-top: 20px;">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="file-item">
              <h4>营业执照</h4>
              <div v-if="merchant?.business_license_url" class="file-preview">
                <el-image
                  :src="merchant.business_license_url"
                  fit="cover"
                  style="width: 200px; height: 150px;"
                  :preview-src-list="[merchant.business_license_url]"
                />
              </div>
              <div v-else class="no-file">暂无文件</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="file-item">
              <h4>身份证正面</h4>
              <div v-if="merchant?.id_card_front_url" class="file-preview">
                <el-image
                  :src="merchant.id_card_front_url"
                  fit="cover"
                  style="width: 200px; height: 150px;"
                  :preview-src-list="[merchant.id_card_front_url]"
                />
              </div>
              <div v-else class="no-file">暂无文件</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="file-item">
              <h4>身份证背面</h4>
              <div v-if="merchant?.id_card_back_url" class="file-preview">
                <el-image
                  :src="merchant.id_card_back_url"
                  fit="cover"
                  style="width: 200px; height: 150px;"
                  :preview-src-list="[merchant.id_card_back_url]"
                />
              </div>
              <div v-else class="no-file">暂无文件</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 审核记录 -->
      <el-card title="审核记录" style="margin-top: 20px;">
        <el-timeline>
          <el-timeline-item
            v-for="record in auditHistory"
            :key="record.id"
            :timestamp="formatTime(record.created_at)"
            placement="top"
          >
            <el-card>
              <h4>{{ record.action_text }}</h4>
              <p>操作人：{{ record.operator_name }}</p>
              <p v-if="record.remark">备注：{{ record.remark }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button @click="goBack">返回</el-button>
        <el-button v-if="merchant?.status === 'pending'" type="success" @click="handleApprove">
          通过审核
        </el-button>
        <el-button v-if="merchant?.status === 'pending'" type="danger" @click="handleReject">
          拒绝申请
        </el-button>
        <el-button v-if="merchant?.status === 'approved'" type="warning" @click="handleSuspend">
          暂停商户
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleCheck, CircleClose, Clock } from '@element-plus/icons-vue';
import { merchantApi } from '@/api/merchant';
import type { Merchant } from '@/types/merchant';
import { formatTime } from '@/utils/format';

const route = useRoute();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const merchant = ref<Merchant | null>(null);
const businessData = ref<any>(null);
const auditHistory = ref<any[]>([]);

// 获取商户详情
const getMerchantDetail = async () => {
  try {
    loading.value = true;
    const id = Number(route.params.id);
    if (!id) {
      ElMessage.error('商户ID无效');
      return;
    }

    const [merchantData, businessResponse, historyResponse] = await Promise.all([
      merchantApi.getMerchant(id),
      merchantApi.getBusinessData(id).catch(() => ({ data: null })),
      merchantApi.getAuditHistory(id).catch(() => ({ data: [] }))
    ]);

    merchant.value = merchantData;
    businessData.value = businessResponse.data;
    auditHistory.value = historyResponse.data;
  } catch (error) {
    console.error('获取商户详情失败:', error);
    ElMessage.error('获取商户详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    suspended: '已暂停'
  };
  return statusMap[status || ''] || '未知';
};

// 事件处理
const goBack = () => {
  router.go(-1);
};

const handleApprove = () => {
  ElMessageBox.confirm('确定要通过该商户的审核申请吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
      if (!merchant.value) return;
      await merchantApi.approveMerchant(merchant.value.id, { status: 'approved' });
      ElMessage.success('审核通过成功');
      getMerchantDetail();
    } catch (error) {
      ElMessage.error('审核操作失败');
    }
  });
};

const handleReject = () => {
  ElMessageBox.prompt('请输入拒绝理由', '拒绝申请', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValidator: (value) => {
      if (!value || value.trim().length === 0) {
        return '请输入拒绝理由';
      }
      return true;
    }
  }).then(async ({ value }) => {
    try {
      if (!merchant.value) return;
      await merchantApi.rejectMerchant(merchant.value.id, value);
      ElMessage.success('已拒绝申请');
      getMerchantDetail();
    } catch (error) {
      ElMessage.error('操作失败');
    }
  });
};

const handleSuspend = () => {
  ElMessageBox.confirm('确定要暂停该商户吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      if (!merchant.value) return;
      await merchantApi.suspendMerchant(merchant.value.id);
      ElMessage.success('已暂停商户');
      getMerchantDetail();
    } catch (error) {
      ElMessage.error('操作失败');
    }
  });
};

// 初始化
onMounted(() => {
  getMerchantDetail();
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
  margin: 10px 0 0 0;
  font-size: 24px;
  font-weight: 500;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.info-item .label {
  width: 100px;
  color: #666;
  font-weight: 500;
}

.status-card {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background: #fff2f0;
  color: #ff4d4f;
}

.status-suspended {
  background: #f0f0f0;
  color: #999;
}

.status-content {
  flex: 1;
}

.status-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.status-time {
  font-size: 12px;
  color: #999;
}

.remark {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.remark h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.remark p {
  margin: 0;
  color: #666;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.data-label {
  color: #666;
  font-size: 14px;
}

.data-value {
  font-weight: 500;
  font-size: 16px;
}

.text-green {
  color: #52c41a;
}

.text-orange {
  color: #fa8c16;
}

.file-item {
  text-align: center;
}

.file-item h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.file-preview {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.no-file {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}

.action-bar {
  margin-top: 30px;
  text-align: center;
}

.action-bar .el-button {
  margin: 0 8px;
}
</style>