<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">系统日志</h1>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleClearLogs">
          <el-icon><Delete /></el-icon>
          清空日志
        </el-button>
        <el-button @click="handleExportLogs">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px;"
        />
        <el-select
          v-model="searchForm.level"
          placeholder="日志级别"
          style="width: 120px; margin-left: 10px;"
          clearable
        >
          <el-option label="DEBUG" value="debug" />
          <el-option label="INFO" value="info" />
          <el-option label="WARN" value="warn" />
          <el-option label="ERROR" value="error" />
        </el-select>
        <el-select
          v-model="searchForm.module"
          placeholder="模块"
          style="width: 120px; margin-left: 10px;"
          clearable
        >
          <el-option label="用户模块" value="user" />
          <el-option label="设备模块" value="device" />
          <el-option label="订单模块" value="order" />
          <el-option label="支付模块" value="payment" />
          <el-option label="系统模块" value="system" />
        </el-select>
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索关键词"
          style="width: 200px; margin-left: 10px;"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- 日志统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><InfoFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.infoCount }}</div>
            <div class="stat-label">INFO</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.warnCount }}</div>
            <div class="stat-label">WARN</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2f0; color: #ff4d4f;">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.errorCount }}</div>
            <div class="stat-label">ERROR</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.debugCount }}</div>
            <div class="stat-label">DEBUG</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 日志列表 -->
    <el-table v-loading="loading" :data="logList" stripe>
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="级别" width="80">
        <template #default="{ row }">
          <el-tag 
            :type="getLevelColor(row.level)"
            size="small"
          >
            {{ row.level.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="100" />
      <el-table-column prop="message" label="消息" min-width="300">
        <template #default="{ row }">
          <span :class="{ 'log-error': row.level === 'error' }">
            {{ row.message }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="user" label="用户" width="120" />
      <el-table-column prop="ip" label="IP地址" width="130" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            link
            @click="handleViewDetail(row)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="60%">
      <div v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatTime(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelColor(selectedLog.level)">
              {{ selectedLog.level.toUpperCase() }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ selectedLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ selectedLog.user || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ selectedLog.ip || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求ID">
            {{ selectedLog.requestId || '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px;">
          <h4>消息内容</h4>
          <el-input
            :model-value="selectedLog.message"
            type="textarea"
            :rows="4"
            readonly
          />
        </div>
        <div v-if="selectedLog.stack" style="margin-top: 20px;">
          <h4>堆栈跟踪</h4>
          <el-input
            :model-value="selectedLog.stack"
            type="textarea"
            :rows="8"
            readonly
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Refresh, 
  Delete, 
  Download, 
  Search,
  InfoFilled,
  WarningFilled,
  CircleCloseFilled,
  SuccessFilled
} from '@element-plus/icons-vue';
import { formatTime } from '@/utils/format';

// 日志记录接口定义
interface LogRecord {
  id: number;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  message: string;
  user?: string;
  ip?: string;
  requestId?: string;
  stack?: string;
}

// 响应式数据
const loading = ref(false);
const logList = ref<LogRecord[]>([]);
const detailDialogVisible = ref(false);
const selectedLog = ref<LogRecord | null>(null);

const logStats = ref({
  infoCount: 0,
  warnCount: 0,
  errorCount: 0,
  debugCount: 0
});

// 搜索表单
const searchForm = reactive({
  dateRange: [] as Date[],
  level: '',
  module: '',
  keyword: '',
  page: 1,
  limit: 20
});

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 模拟数据
const mockLogData = (): LogRecord[] => {
  const levels = ['debug', 'info', 'warn', 'error'] as const;
  const modules = ['user', 'device', 'order', 'payment', 'system'];
  const users = ['admin', 'user001', 'merchant001', null];
  const ips = ['192.168.1.100', '10.0.0.1', '172.16.0.1'];
  
  const messages = [
    '用户登录成功',
    '设备状态更新',
    '订单创建成功',
    '支付处理完成',
    '系统配置更新',
    '数据库连接超时',
    '接口请求失败',
    '权限验证失败',
    '文件上传成功',
    '缓存清理完成'
  ];

  return Array.from({ length: 100 }, (_, i) => ({
    id: 100000 + i,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    level: levels[i % levels.length],
    module: modules[i % modules.length],
    message: messages[i % messages.length],
    user: users[i % users.length] || undefined,
    ip: ips[i % ips.length],
    requestId: `req_${String(Date.now() + i).slice(-8)}`,
    stack: levels[i % levels.length] === 'error' ? 'Error stack trace...' : undefined
  }));
};

// 获取日志列表
const getLogList = async () => {
  try {
    loading.value = true;
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockData = mockLogData();
    
    // 模拟分页
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    logList.value = mockData.slice(start, end);
    pagination.total = mockData.length;
  } catch (error) {
    console.error('获取日志列表失败:', error);
    ElMessage.error('获取日志列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取日志统计
const getLogStats = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300));
    logStats.value = {
      infoCount: 1234,
      warnCount: 156,
      errorCount: 23,
      debugCount: 2567
    };
  } catch (error) {
    console.error('获取日志统计失败:', error);
  }
};

// 级别颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    debug: 'success',
    info: 'primary',
    warn: 'warning',
    error: 'danger'
  };
  return colorMap[level] || 'info';
};

// 事件处理
const handleSearch = () => {
  pagination.page = 1;
  getLogList();
};

const handleRefresh = () => {
  getLogList();
  getLogStats();
};

const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getLogList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getLogList();
};

const handleClearLogs = () => {
  ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('日志清空成功');
    getLogList();
    getLogStats();
  });
};

const handleExportLogs = () => {
  ElMessage.success('日志导出功能开发中');
};

const handleViewDetail = (row: LogRecord) => {
  selectedLog.value = row;
  detailDialogVisible.value = true;
};

// 初始化
onMounted(() => {
  getLogList();
  getLogStats();
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.log-error {
  color: #f56c6c;
}
</style>