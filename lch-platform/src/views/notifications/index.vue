<template>
  <div class="notifications-management">
    <div class="page-header">
      <h2>通知管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Message /></el-icon>
        发送通知
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">总通知数</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.unread }}</div>
          <div class="stat-label">未读通知</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.readRate }}%</div>
          <div class="stat-label">阅读率</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ getTopNotificationType() }}</div>
          <div class="stat-label">主要类型</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="通知类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable>
            <el-option label="系统通知" value="system" />
            <el-option label="订单通知" value="order" />
            <el-option label="支付通知" value="payment" />
            <el-option label="设备通知" value="device" />
            <el-option label="商户通知" value="merchant" />
            <el-option label="营销通知" value="promotion" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="全部优先级" clearable>
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.readStatus" placeholder="全部状态" clearable>
            <el-option label="已读" value="read" />
            <el-option label="未读" value="unread" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadNotifications">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card>
      <el-table 
        :data="notifications" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getNotificationTypeTag(row.type)">
              {{ getNotificationTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getPriorityTag(row.priority)"
              :effect="row.priority === 'urgent' ? 'dark' : 'light'"
            >
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="范围" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_global ? 'warning' : 'info'">
              {{ row.is_global ? '全局' : '个人' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_read ? 'success' : 'danger'">
              {{ row.is_read ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewNotification(row)">查看</el-button>
            <el-button size="small" type="danger" @click="deleteNotificationItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发送通知对话框 -->
    <el-dialog
      title="发送通知"
      v-model="showCreateDialog"
      width="600px"
    >
      <el-form :model="notificationForm" :rules="notificationRules" ref="notificationFormRef" label-width="120px">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="notificationForm.type">
            <el-option label="系统通知" value="system" />
            <el-option label="订单通知" value="order" />
            <el-option label="支付通知" value="payment" />
            <el-option label="设备通知" value="device" />
            <el-option label="商户通知" value="merchant" />
            <el-option label="营销通知" value="promotion" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送范围" prop="is_global">
          <el-radio-group v-model="notificationForm.is_global">
            <el-radio :label="true">全局通知</el-radio>
            <el-radio :label="false">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!notificationForm.is_global" label="用户ID" prop="user_id">
          <el-input-number v-model="notificationForm.user_id" :min="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="notificationForm.priority">
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="notificationForm.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <el-input 
            v-model="notificationForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入通知内容"
          />
        </el-form-item>
        <el-form-item label="动作类型">
          <el-select v-model="notificationForm.action_type">
            <el-option label="无动作" value="none" />
            <el-option label="跳转URL" value="url" />
            <el-option label="跳转页面" value="page" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="notificationForm.action_type !== 'none'" label="动作数据">
          <el-input 
            v-model="notificationForm.action_data" 
            :placeholder="notificationForm.action_type === 'url' ? '请输入URL地址' : '请输入页面路径'"
          />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="notificationForm.expire_at"
            type="datetime"
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="sendNotification" :loading="sending">发送</el-button>
      </template>
    </el-dialog>

    <!-- 查看通知详情对话框 -->
    <el-dialog
      title="通知详情"
      v-model="showDetailDialog"
      width="500px"
    >
      <div v-if="selectedNotification" class="notification-detail">
        <div class="detail-item">
          <label>类型：</label>
          <el-tag :type="getNotificationTypeTag(selectedNotification.type)">
            {{ getNotificationTypeText(selectedNotification.type) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>优先级：</label>
          <el-tag :type="getPriorityTag(selectedNotification.priority)">
            {{ getPriorityText(selectedNotification.priority) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>标题：</label>
          <span>{{ selectedNotification.title }}</span>
        </div>
        <div class="detail-item">
          <label>内容：</label>
          <p class="content">{{ selectedNotification.content }}</p>
        </div>
        <div v-if="selectedNotification.action_type !== 'none'" class="detail-item">
          <label>动作：</label>
          <span>{{ selectedNotification.action_type === 'url' ? 'URL跳转' : '页面跳转' }}</span>
          <code>{{ selectedNotification.action_data }}</code>
        </div>
        <div class="detail-item">
          <label>发送时间：</label>
          <span>{{ formatDateTime(selectedNotification.created_at) }}</span>
        </div>
        <div v-if="selectedNotification.expire_at" class="detail-item">
          <label>过期时间：</label>
          <span>{{ formatDateTime(selectedNotification.expire_at) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Message } from '@element-plus/icons-vue';
import {
  getNotifications,
  getNotificationStatistics,
  sendSystemNotification,
  sendUserNotification,
  deleteNotification,
  type NotificationItem,
  type NotificationStatistics
} from '@/api/notifications';

// 响应式数据
const loading = ref(false);
const sending = ref(false);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const notifications = ref<NotificationItem[]>([]);
const selectedNotification = ref<NotificationItem | null>(null);
const statistics = ref<NotificationStatistics>({
  total: 0,
  unread: 0,
  readRate: '0',
  byType: []
});

// 筛选器
const filters = reactive({
  type: '',
  priority: '',
  readStatus: ''
});

// 表单数据
const notificationForm = reactive({
  type: 'system',
  is_global: true,
  user_id: 1,
  priority: 'normal',
  title: '',
  content: '',
  action_type: 'none',
  action_data: '',
  expire_at: ''
});

// 表单验证规则
const notificationRules = {
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  user_id: [
    { 
      required: true, 
      validator: (rule: any, value: any, callback: any) => {
        if (!notificationForm.is_global && !value) {
          callback(new Error('请输入用户ID'));
        } else {
          callback();
        }
      },
      trigger: 'blur' 
    }
  ]
};

const notificationFormRef = ref();

// 工具函数
const getNotificationTypeText = (type: string) => {
  const map = {
    system: '系统',
    order: '订单',
    payment: '支付',
    device: '设备',
    merchant: '商户',
    promotion: '营销'
  };
  return map[type] || type;
};

const getNotificationTypeTag = (type: string) => {
  const map = {
    system: 'info',
    order: 'success',
    payment: 'warning',
    device: 'danger',
    merchant: 'primary',
    promotion: 'warning'
  };
  return map[type] || '';
};

const getPriorityText = (priority: string) => {
  const map = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  };
  return map[priority] || priority;
};

const getPriorityTag = (priority: string) => {
  const map = {
    low: 'info',
    normal: 'success',
    high: 'warning',
    urgent: 'danger'
  };
  return map[priority] || '';
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};

const getTopNotificationType = () => {
  if (!statistics.value.byType.length) return '-';
  const top = statistics.value.byType.reduce((max, item) => 
    item.count > max.count ? item : max
  );
  return getNotificationTypeText(top.type);
};

// 业务方法
const loadNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await getNotifications();
    notifications.value = data || [];
  } catch (error) {
    console.error('加载通知失败:', error);
    ElMessage.error('加载通知失败');
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    const { data } = await getNotificationStatistics();
    statistics.value = data || statistics.value;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

const resetForm = () => {
  Object.assign(notificationForm, {
    type: 'system',
    is_global: true,
    user_id: 1,
    priority: 'normal',
    title: '',
    content: '',
    action_type: 'none',
    action_data: '',
    expire_at: ''
  });
};

const sendNotification = async () => {
  if (!notificationFormRef.value) return;
  
  try {
    await notificationFormRef.value.validate();
    sending.value = true;

    if (notificationForm.is_global) {
      await sendSystemNotification({
        title: notificationForm.title,
        content: notificationForm.content,
        priority: notificationForm.priority as any
      });
    } else {
      await sendUserNotification({
        userId: notificationForm.user_id,
        type: notificationForm.type,
        title: notificationForm.title,
        content: notificationForm.content
      });
    }

    ElMessage.success('发送成功');
    showCreateDialog.value = false;
    resetForm();
    loadNotifications();
    loadStatistics();
  } catch (error) {
    console.error('发送失败:', error);
    ElMessage.error('发送失败');
  } finally {
    sending.value = false;
  }
};

const viewNotification = (notification: NotificationItem) => {
  selectedNotification.value = notification;
  showDetailDialog.value = true;
};

const deleteNotificationItem = async (notification: NotificationItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '确认删除', {
      type: 'warning'
    });
    
    await deleteNotification(notification.id);
    ElMessage.success('删除成功');
    loadNotifications();
    loadStatistics();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const resetFilters = () => {
  Object.assign(filters, {
    type: '',
    priority: '',
    readStatus: ''
  });
  loadNotifications();
};

// 生命周期
onMounted(() => {
  loadNotifications();
  loadStatistics();
});
</script>

<style scoped>
.notifications-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.notification-detail .detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.notification-detail .detail-item label {
  width: 80px;
  font-weight: bold;
  color: #606266;
  flex-shrink: 0;
}

.notification-detail .content {
  white-space: pre-wrap;
  line-height: 1.6;
  margin: 0;
}

.notification-detail code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  margin-left: 8px;
}
</style>