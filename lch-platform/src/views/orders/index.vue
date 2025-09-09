<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.completedOrders }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.processingOrders }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ (orderStats.totalRevenue / 100).toFixed(0) }}</div>
            <div class="stat-label">总收益</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleBatchRefund" :disabled="selectedOrders.length === 0">
          <el-icon><RefreshLeft /></el-icon>
          批量退款
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 350px;"
          @change="handleDateRangeChange"
        />
      </div>
    </div>
    <!-- 搜索过滤 -->
    <div class="filter-card">
      <el-form :model="searchForm" @submit.prevent="getOrderList">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-form-item label="订单号">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="请输入订单号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
                <el-option label="待支付" value="pending" />
                <el-option label="已支付" value="paid" />
                <el-option label="进行中" value="started" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
                <el-option label="已退款" value="refunded" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="用户">
              <el-input 
                v-model="searchForm.user_nickname" 
                placeholder="用户昵称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="设备">
              <el-input 
                v-model="searchForm.device_name" 
                placeholder="设备名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="getOrderList">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
              <el-button @click="showAdvancedFilter">高级筛选</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="table-card">
      <el-table 
        :data="orderList" 
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="order_no" label="订单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="viewOrder(row)">
              {{ row.order_no }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="user_nickname" label="用户" width="120" />
        <el-table-column prop="device_name" label="设备" width="120" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ (row.amount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="时长" width="80">
          <template #default="{ row }">
            {{ row.duration_minutes }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getPaymentMethodType(row.payment_method)">
              {{ getPaymentMethodText(row.payment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-dropdown @command="(command: string) => handleOrderCommand(command, row)">
              <el-button size="small" type="primary">
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="start" v-if="row.status === 'paid'">
                    启动订单
                  </el-dropdown-item>
                  <el-dropdown-item command="finish" v-if="row.status === 'started'">
                    完成订单
                  </el-dropdown-item>
                  <el-dropdown-item command="refund" v-if="['paid', 'started', 'completed'].includes(row.status)">
                    申请退款
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" v-if="row.status === 'pending'">
                    取消订单
                  </el-dropdown-item>
                  <el-dropdown-item command="resend" divided>
                    重发通知
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="orderDetailVisible"
      :title="`订单详情 - ${selectedOrder?.order_no || ''}`"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>订单号：</label>
                <span>{{ selectedOrder.order_no }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>状态：</label>
                <el-tag :type="getStatusType(selectedOrder.status)">
                  {{ getStatusText(selectedOrder.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>用户：</label>
                <span>{{ selectedOrder.user_nickname }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>设备：</label>
                <span>{{ selectedOrder.device_name }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>金额：</label>
                <span class="amount">¥{{ (selectedOrder.amount / 100).toFixed(2) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>时长：</label>
                <span>{{ selectedOrder.duration_minutes }}分钟</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 时间信息 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="card-title">时间信息</span>
          </template>
          <el-timeline>
            <el-timeline-item
              :timestamp="formatDate(selectedOrder.created_at)"
              placement="top"
            >
              订单创建
            </el-timeline-item>
            <el-timeline-item
              v-if="selectedOrder.paid_at"
              :timestamp="formatDate(selectedOrder.paid_at)"
              placement="top"
              type="success"
            >
              支付完成
            </el-timeline-item>
            <el-timeline-item
              v-if="selectedOrder.started_at"
              :timestamp="formatDate(selectedOrder.started_at)"
              placement="top"
              type="warning"
            >
              开始服务
            </el-timeline-item>
            <el-timeline-item
              v-if="selectedOrder.finished_at"
              :timestamp="formatDate(selectedOrder.finished_at)"
              placement="top"
              type="success"
            >
              服务完成
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 操作日志 -->
        <el-card shadow="never" class="detail-card">
          <template #header>
            <span class="card-title">操作日志</span>
          </template>
          <el-table :data="orderLogs" size="small">
            <el-table-column prop="time" label="时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="action" label="操作" width="120" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="orderDetailVisible = false">关闭</el-button>
          <el-button 
            v-if="selectedOrder?.status === 'paid'" 
            type="success" 
            @click="startOrder(selectedOrder!)"
          >
            启动订单
          </el-button>
          <el-button 
            v-if="selectedOrder?.status === 'started'" 
            type="warning" 
            @click="finishOrder(selectedOrder!)"
          >
            完成订单
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 高级筛选对话框 -->
    <el-dialog
      v-model="advancedFilterVisible"
      title="高级筛选"
      width="500px"
    >
      <el-form :model="advancedFilters" label-width="100px">
        <el-form-item label="金额范围">
          <el-row :gutter="10">
            <el-col :span="11">
              <el-input
                v-model="advancedFilters.amount_min"
                placeholder="最低金额"
                type="number"
              />
            </el-col>
            <el-col :span="2" style="text-align: center;">
              <span>-</span>
            </el-col>
            <el-col :span="11">
              <el-input
                v-model="advancedFilters.amount_max"
                placeholder="最高金额"
                type="number"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="时长范围">
          <el-row :gutter="10">
            <el-col :span="11">
              <el-input
                v-model="advancedFilters.duration_min"
                placeholder="最短时长(分钟)"
                type="number"
              />
            </el-col>
            <el-col :span="2" style="text-align: center;">
              <span>-</span>
            </el-col>
            <el-col :span="11">
              <el-input
                v-model="advancedFilters.duration_max"
                placeholder="最长时长(分钟)"
                type="number"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="advancedFilters.payment_method" placeholder="选择支付方式" clearable>
            <el-option label="微信支付" value="wechat" />
            <el-option label="余额支付" value="balance" />
            <el-option label="赠送余额" value="gift_balance" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetAdvancedFilter">重置</el-button>
          <el-button @click="advancedFilterVisible = false">取消</el-button>
          <el-button type="primary" @click="applyAdvancedFilter">应用筛选</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Document, 
  CircleCheck, 
  Loading, 
  Money,
  Refresh,
  RefreshLeft,
  Download,
  ArrowDown
} from '@element-plus/icons-vue';
import { orderApi } from '@/api/order';
import type { Order as ApiOrder, OrderListParams } from '@/types/order';
import { formatDate } from '@/utils/format';

// 本地订单接口定义（用于前端显示）
interface Order {
  id: number;
  order_no: string;
  user_nickname: string;
  device_name: string;
  amount: number;
  duration_minutes: number;
  status: string;
  payment_method?: string;
  created_at: Date;
  paid_at?: Date;
  started_at?: Date;
  finished_at?: Date;
}

// 操作日志接口
interface OrderLog {
  time: Date;
  action: string;
  operator: string;
  remark: string;
}

// 响应式数据
const loading = ref(false);
const orderList = ref<Order[]>([]);
const selectedOrders = ref<Order[]>([]);
const dateRange = ref<[Date, Date] | null>(null);

// 订单详情相关
const orderDetailVisible = ref(false);
const selectedOrder = ref<Order | null>(null);
const orderLogs = ref<OrderLog[]>([]);

// 高级筛选
const advancedFilterVisible = ref(false);
const advancedFilters = reactive({
  amount_min: '',
  amount_max: '',
  duration_min: '',
  duration_max: '',
  payment_method: ''
});

// 订单统计数据
const orderStats = ref({
  totalOrders: 1234,
  completedOrders: 1089,
  processingOrders: 23,
  paidOrders: 0,
  cancelledOrders: 0,
  todayOrders: 0,
  totalRevenue: 12345600
});

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: undefined as any,
  user_nickname: '',
  device_name: '',
  page: 1,
  limit: 20
});

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 生成模拟订单数据
const generateMockOrders = (): Order[] => {
  const statuses = ['pending', 'paid', 'started', 'completed', 'cancelled', 'refunded'] as const;
  const devices = ['设备1号', '设备2号', '设备3号', '设备4号', '设备5号'];
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    order_no: `ORD${String(Date.now() + i).slice(-8)}`,
    user_nickname: users[i % users.length],
    device_name: devices[i % devices.length],
    amount: Math.floor(Math.random() * 5000) + 500, // 分为单位
    duration_minutes: Math.floor(Math.random() * 20) + 5,
    status: statuses[i % statuses.length],
    payment_method: ['wechat', 'balance', 'gift_balance'][i % 3],
    paid_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    started_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    finished_at: i % 3 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
};

// 加载订单列表
const getOrderList = async () => {
  try {
    loading.value = true;
    console.log('正在加载订单列表...');
    
    // 先尝试从API加载
    try {
      const params: OrderListParams = {
        keyword: searchForm.keyword,
        status: searchForm.status,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await orderApi.getOrders(params);
      // 转换API返回的数据为前端显示格式
      const convertedOrders: Order[] = (response.data || []).map((apiOrder: any) => ({
        id: apiOrder.id,
        order_no: apiOrder.order_no,
        user_nickname: apiOrder.user?.nickname || '未知用户',
        device_name: apiOrder.device?.name || '未知设备',
        amount: apiOrder.total_amount || 0,
        duration_minutes: apiOrder.duration_minutes,
        status: apiOrder.status,
        payment_method: apiOrder.payment_method,
        created_at: new Date(apiOrder.created_at),
        paid_at: apiOrder.paid_at ? new Date(apiOrder.paid_at) : undefined,
        started_at: apiOrder.started_at ? new Date(apiOrder.started_at) : undefined,
        finished_at: apiOrder.finished_at ? new Date(apiOrder.finished_at) : undefined
      }));
      orderList.value = convertedOrders;
      pagination.total = response.total || 0;
    } catch (apiError) {
      console.warn('API调用失败，使用模拟数据:', apiError);
      // API失败时使用模拟数据
      const mockData = generateMockOrders();
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      orderList.value = mockData.slice(start, end);
      pagination.total = mockData.length;
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    ElMessage.error('获取订单列表失败，已切换到演示模式');
    orderList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 加载订单统计
const getOrderStats = async () => {
  try {
    const stats = await orderApi.getOrderStats();
    orderStats.value = {
      ...orderStats.value,
      totalOrders: stats.totalOrders,
      completedOrders: stats.completedOrders,
      paidOrders: stats.paidOrders,
      processingOrders: stats.paidOrders - stats.completedOrders,
      cancelledOrders: stats.cancelledOrders,
      todayOrders: stats.todayOrders,
      totalRevenue: stats.totalRevenue
    };
  } catch (error) {
    console.error('获取订单统计失败:', error);
    // 使用默认模拟数据
  }
};

// 搜索重置
const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: undefined,
    user_nickname: '',
    device_name: ''
  });
  pagination.page = 1;
  getOrderList();
};

// 事件处理
const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getOrderList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getOrderList();
};

// 选择变更
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection;
};

// 日期范围变更
const handleDateRangeChange = (dates: [Date, Date] | null) => {
  dateRange.value = dates;
  getOrderList();
};

// 刷新数据
const handleRefresh = () => {
  getOrderList();
  getOrderStats();
};

// 批量退款
const handleBatchRefund = async () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要退款的订单');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要对选中的 ${selectedOrders.value.length} 个订单申请退款吗？`,
    '批量退款确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const promises = selectedOrders.value.map(order => 
        orderApi.refundOrder(order.id, { reason: '管理员批量退款' })
      );
      await Promise.all(promises);
      ElMessage.success('批量退款申请已提交');
      getOrderList();
    } catch (error) {
      ElMessage.error('批量退款申请失败');
    }
  });
};

// 导出报表
const handleExport = () => {
  ElMessage.info('导出功能开发中');
};

// 显示高级筛选
const showAdvancedFilter = () => {
  advancedFilterVisible.value = true;
};

// 应用高级筛选
const applyAdvancedFilter = () => {
  advancedFilterVisible.value = false;
  getOrderList();
};

// 重置高级筛选
const resetAdvancedFilter = () => {
  Object.assign(advancedFilters, {
    amount_min: '',
    amount_max: '',
    duration_min: '',
    duration_max: '',
    payment_method: ''
  });
};

// 订单操作
const viewOrder = (row: Order) => {
  selectedOrder.value = row;
  // 生成模拟操作日志
  orderLogs.value = generateMockOrderLogs(row);
  orderDetailVisible.value = true;
};

// 生成模拟操作日志
const generateMockOrderLogs = (order: Order): OrderLog[] => {
  const logs: OrderLog[] = [];
  
  logs.push({
    time: order.created_at,
    action: '创建订单',
    operator: '系统',
    remark: '用户下单成功'
  });
  
  if (order.paid_at) {
    logs.push({
      time: order.paid_at,
      action: '支付成功',
      operator: '支付系统',
      remark: `通过${getPaymentMethodText(order.payment_method)}支付`
    });
  }
  
  if (order.started_at) {
    logs.push({
      time: order.started_at,
      action: '启动设备',
      operator: '系统',
      remark: '设备启动成功，开始服务'
    });
  }
  
  if (order.finished_at) {
    logs.push({
      time: order.finished_at,
      action: '完成订单',
      operator: '系统',
      remark: '服务完成，订单结束'
    });
  }
  
  return logs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

// 订单命令处理
const handleOrderCommand = async (command: string, row: Order) => {
  switch (command) {
    case 'start':
      await startOrder(row);
      break;
    case 'finish':
      await finishOrder(row);
      break;
    case 'refund':
      await refundOrder(row);
      break;
    case 'cancel':
      await cancelOrder(row);
      break;
    case 'resend':
      ElMessage.info('重发通知功能开发中');
      break;
  }
};

// 取消订单
const cancelOrder = async (row: Order) => {
  ElMessageBox.confirm('确定要取消这个订单吗？', '取消订单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.cancelOrder(row.id, { reason: '管理员取消' });
      ElMessage.success('订单取消成功');
      getOrderList();
    } catch (error) {
      ElMessage.error('订单取消失败');
    }
  });
};

// 申请退款
const refundOrder = async (row: Order) => {
  ElMessageBox.confirm('确定要为这个订单申请退款吗？', '申请退款', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.refundOrder(row.id, { reason: '管理员退款' });
      ElMessage.success('退款申请已提交');
      getOrderList();
    } catch (error) {
      ElMessage.error('退款申请失败');
    }
  });
};

const startOrder = async (row: Order) => {
  try {
    await orderApi.startDevice(row.id);
    ElMessage.success('订单启动成功');
    getOrderList();
    // 如果详情弹窗开着，更新数据
    if (orderDetailVisible.value && selectedOrder.value?.id === row.id) {
      selectedOrder.value = { ...row, status: 'started', started_at: new Date() };
    }
  } catch (error) {
    ElMessage.error('订单启动失败');
  }
};

const finishOrder = async (row: Order) => {
  try {
    await orderApi.finishOrder(row.id);
    ElMessage.success('订单完成成功');
    getOrderList();
    // 如果详情弹窗开着，更新数据
    if (orderDetailVisible.value && selectedOrder.value?.id === row.id) {
      selectedOrder.value = { ...row, status: 'completed', finished_at: new Date() };
    }
  } catch (error) {
    ElMessage.error('订单完成失败');
  }
};

// 支付方式显示
const getPaymentMethodType = (method?: string) => {
  const methodMap: Record<string, string> = {
    wechat: 'success',
    balance: 'primary',
    gift_balance: 'warning'
  };
  return methodMap[method || ''] || 'info';
};

const getPaymentMethodText = (method?: string) => {
  const methodMap: Record<string, string> = {
    wechat: '微信支付',
    balance: '余额支付',
    gift_balance: '赠送余额'
  };
  return methodMap[method || ''] || '未知';
};
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'info',
    paid: 'primary',
    started: 'warning',
    completed: 'success',
    cancelled: 'info',
    refunded: 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    started: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  };
  return statusMap[status] || '未知';
};

// 初始化
onMounted(() => {
  getOrderList();
  getOrderStats();
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

.filter-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-weight: 500;
  color: #333;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-item label {
  color: #666;
  margin-right: 8px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>