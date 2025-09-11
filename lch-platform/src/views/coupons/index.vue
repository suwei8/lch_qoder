<template>
  <div class="coupons-management">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建优惠券
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.totalCoupons }}</div>
          <div class="stat-label">总优惠券数</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.activeCoupons }}</div>
          <div class="stat-label">活跃优惠券</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.totalClaimed }}</div>
          <div class="stat-label">已领取数量</div>
        </div>
      </el-card>
      <el-card>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.usageRate }}%</div>
          <div class="stat-label">使用率</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="优惠券类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable>
            <el-option label="满减券" value="amount" />
            <el-option label="折扣券" value="discount" />
            <el-option label="免费时长券" value="free_minutes" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="未生效" value="inactive" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCoupons">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 优惠券列表 -->
    <el-card>
      <el-table 
        :data="coupons" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="优惠券名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCouponTypeTag(row.type)">
              {{ getCouponTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 'amount'">减{{ row.value }}元</span>
            <span v-else-if="row.type === 'discount'">{{ (row.value * 10).toFixed(1) }}折</span>
            <span v-else>{{ row.value }}分钟免费</span>
          </template>
        </el-table-column>
        <el-table-column prop="min_amount" label="最低消费" width="100">
          <template #default="{ row }">
            {{ row.min_amount > 0 ? `${row.min_amount}元` : '无门槛' }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            {{ row.remaining_quantity }} / {{ row.total_quantity }}
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.start_date) }} 至 {{ formatDate(row.end_date) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCoupon(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggleCouponStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteCouponItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      :title="editingCoupon ? '编辑优惠券' : '新建优惠券'"
      v-model="showCreateDialog"
      width="600px"
    >
      <el-form :model="couponForm" :rules="couponRules" ref="couponFormRef" label-width="120px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="couponForm.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠券描述" prop="description">
          <el-input 
            v-model="couponForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入优惠券描述"
          />
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-select v-model="couponForm.type" @change="onTypeChange">
            <el-option label="满减券" value="amount" />
            <el-option label="折扣券" value="discount" />
            <el-option label="免费时长券" value="free_minutes" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠值" prop="value">
          <el-input-number 
            v-model="couponForm.value" 
            :min="0"
            :precision="couponForm.type === 'discount' ? 2 : 0"
            :max="couponForm.type === 'discount' ? 1 : undefined"
            style="width: 200px"
          />
          <span class="input-suffix">
            {{ getValueSuffix(couponForm.type) }}
          </span>
        </el-form-item>
        <el-form-item v-if="couponForm.type !== 'free_minutes'" label="最低消费" prop="min_amount">
          <el-input-number v-model="couponForm.min_amount" :min="0" style="width: 200px" />
          <span class="input-suffix">元</span>
        </el-form-item>
        <el-form-item v-if="couponForm.type === 'discount'" label="最大优惠金额">
          <el-input-number v-model="couponForm.max_discount_amount" :min="0" style="width: 200px" />
          <span class="input-suffix">元</span>
        </el-form-item>
        <el-form-item label="发行数量" prop="total_quantity">
          <el-input-number v-model="couponForm.total_quantity" :min="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="有效期" prop="dateRange">
          <el-date-picker
            v-model="couponForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="couponForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getCoupons,
  getCouponStatistics,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CouponStatistics
} from '@/api/coupons';

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const showCreateDialog = ref(false);
const editingCoupon = ref<Coupon | null>(null);
const coupons = ref<Coupon[]>([]);
const statistics = ref<CouponStatistics>({
  totalCoupons: 0,
  activeCoupons: 0,
  totalClaimed: 0,
  totalUsed: 0,
  usageRate: '0'
});

// 筛选器
const filters = reactive({
  type: '',
  status: ''
});

// 表单数据
const couponForm = reactive({
  name: '',
  description: '',
  type: 'amount' as 'amount' | 'discount' | 'free_minutes',
  value: 0,
  min_amount: 0,
  max_discount_amount: 0,
  total_quantity: 100,
  dateRange: [] as string[],
  is_active: true
});

// 表单验证规则
const couponRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入优惠值', trigger: 'blur' }],
  total_quantity: [{ required: true, message: '请输入发行数量', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择有效期', trigger: 'change' }]
};

const couponFormRef = ref();

// 工具函数
const getCouponTypeText = (type: string) => {
  const map = {
    amount: '满减券',
    discount: '折扣券',
    free_minutes: '免费券'
  };
  return map[type] || type;
};

const getCouponTypeTag = (type: string) => {
  const map = {
    amount: 'success',
    discount: 'warning',
    free_minutes: 'info'
  };
  return map[type] || '';
};

const getValueSuffix = (type: string) => {
  const map = {
    amount: '元',
    discount: '折（0.1-1.0）',
    free_minutes: '分钟'
  };
  return map[type] || '';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

// 业务方法
const loadCoupons = async () => {
  loading.value = true;
  try {
    const { data } = await getCoupons();
    coupons.value = data || [];
  } catch (error) {
    console.error('加载优惠券失败:', error);
    ElMessage.error('加载优惠券失败');
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    const { data } = await getCouponStatistics();
    statistics.value = data || statistics.value;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

const onTypeChange = () => {
  if (couponForm.type === 'free_minutes') {
    couponForm.min_amount = 0;
  }
  if (couponForm.type !== 'discount') {
    couponForm.max_discount_amount = 0;
  }
};

const resetForm = () => {
  Object.assign(couponForm, {
    name: '',
    description: '',
    type: 'amount',
    value: 0,
    min_amount: 0,
    max_discount_amount: 0,
    total_quantity: 100,
    dateRange: [],
    is_active: true
  });
  editingCoupon.value = null;
};

const editCoupon = (coupon: Coupon) => {
  editingCoupon.value = coupon;
  Object.assign(couponForm, {
    ...coupon,
    dateRange: [coupon.start_date, coupon.end_date]
  });
  showCreateDialog.value = true;
};

const saveCoupon = async () => {
  if (!couponFormRef.value) return;
  
  try {
    await couponFormRef.value.validate();
    saving.value = true;

    const data = {
      ...couponForm,
      start_date: couponForm.dateRange[0],
      end_date: couponForm.dateRange[1],
      remaining_quantity: editingCoupon.value?.remaining_quantity || couponForm.total_quantity
    };
    delete data.dateRange;

    if (editingCoupon.value) {
      await updateCoupon(editingCoupon.value.id, data);
      ElMessage.success('更新成功');
    } else {
      await createCoupon(data);
      ElMessage.success('创建成功');
    }

    showCreateDialog.value = false;
    resetForm();
    loadCoupons();
    loadStatistics();
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const toggleCouponStatus = async (coupon: Coupon) => {
  try {
    await updateCoupon(coupon.id, { is_active: !coupon.is_active });
    ElMessage.success('状态更新成功');
    loadCoupons();
    loadStatistics();
  } catch (error) {
    console.error('状态更新失败:', error);
    ElMessage.error('状态更新失败');
  }
};

const deleteCouponItem = async (coupon: Coupon) => {
  try {
    await ElMessageBox.confirm('确定要删除这个优惠券吗？', '确认删除', {
      type: 'warning'
    });
    
    await deleteCoupon(coupon.id);
    ElMessage.success('删除成功');
    loadCoupons();
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
    status: ''
  });
  loadCoupons();
};

// 生命周期
onMounted(() => {
  loadCoupons();
  loadStatistics();
});
</script>

<style scoped>
.coupons-management {
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

.input-suffix {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}
</style>