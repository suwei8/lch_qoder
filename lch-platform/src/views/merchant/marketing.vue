<template>
  <div class="page-container">
    <el-card class="page-header" shadow="never">
      <h2>营销工具</h2>
      <p>管理优惠券、充值套餐、营销活动</p>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px;">
      <!-- 充值套餐管理 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>充值套餐管理</span>
              <el-button type="primary" size="small" @click="addRechargePackage">
                <el-icon><Plus /></el-icon>
                新增套餐
              </el-button>
            </div>
          </template>
          
          <div v-for="pkg in rechargePackages" :key="pkg.id" class="package-item">
            <div class="package-content">
              <div class="package-info">
                <h4>充{{ pkg.amount }}送{{ pkg.bonus }}</h4>
                <p>实际到账：¥{{ (pkg.amount + pkg.bonus).toFixed(2) }}</p>
              </div>
              <div class="package-status">
                <el-tag :type="pkg.status === 'active' ? 'success' : 'info'">
                  {{ pkg.status === 'active' ? '启用' : '停用' }}
                </el-tag>
              </div>
            </div>
            <div class="package-actions">
              <el-button size="small" @click="editPackage(pkg)">编辑</el-button>
              <el-button 
                size="small" 
                :type="pkg.status === 'active' ? 'danger' : 'success'"
                @click="togglePackageStatus(pkg)"
              >
                {{ pkg.status === 'active' ? '停用' : '启用' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 优惠券管理 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>优惠券管理</span>
              <el-button type="primary" size="small" @click="addCoupon">
                <el-icon><Plus /></el-icon>
                发放优惠券
              </el-button>
            </div>
          </template>
          
          <div v-for="coupon in coupons" :key="coupon.id" class="coupon-item">
            <div class="coupon-content">
              <div class="coupon-info">
                <h4>{{ coupon.name }}</h4>
                <p v-if="coupon.type === 'discount'">{{ coupon.discount }}折优惠</p>
                <p v-else>满{{ coupon.minAmount }}减{{ coupon.discountAmount }}</p>
                <p class="coupon-validity">有效期至：{{ coupon.validUntil }}</p>
              </div>
              <div class="coupon-stats">
                <el-tag type="info" size="small">已发放：{{ coupon.issued }}</el-tag>
                <el-tag type="success" size="small">已使用：{{ coupon.used }}</el-tag>
              </div>
            </div>
            <div class="coupon-actions">
              <el-button size="small" @click="viewCouponDetails(coupon)">详情</el-button>
              <el-button size="small" type="danger" @click="stopCoupon(coupon)">停止发放</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 营销活动统计 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <span>营销活动效果统计</span>
      </template>
      
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥12,345.67</div>
            <div class="stat-label">充值套餐收入</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">234</div>
            <div class="stat-label">优惠券使用次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥3,456.78</div>
            <div class="stat-label">优惠券核销金额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">89</div>
            <div class="stat-label">新增活跃用户</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface RechargePackage {
  id: number;
  amount: number;
  bonus: number;
  status: 'active' | 'inactive';
}

interface Coupon {
  id: number;
  name: string;
  type: 'discount' | 'reduce';
  discount?: number;
  minAmount?: number;
  discountAmount?: number;
  validUntil: string;
  issued: number;
  used: number;
}

// 充值套餐数据
const rechargePackages = ref<RechargePackage[]>([
  { id: 1, amount: 100, bonus: 20, status: 'active' },
  { id: 2, amount: 200, bonus: 50, status: 'active' },
  { id: 3, amount: 500, bonus: 150, status: 'active' },
  { id: 4, amount: 1000, bonus: 300, status: 'inactive' },
]);

// 优惠券数据
const coupons = ref<Coupon[]>([
  {
    id: 1,
    name: '新人专享券',
    type: 'reduce',
    minAmount: 50,
    discountAmount: 10,
    validUntil: '2024-02-29',
    issued: 156,
    used: 89,
  },
  {
    id: 2,
    name: '周末特惠',
    type: 'discount',
    discount: 8.5,
    validUntil: '2024-01-31',
    issued: 298,
    used: 167,
  },
  {
    id: 3,
    name: '月度回馈券',
    type: 'reduce',
    minAmount: 100,
    discountAmount: 25,
    validUntil: '2024-03-15',
    issued: 89,
    used: 23,
  },
]);

const addRechargePackage = () => {
  ElMessage.info('新增充值套餐功能开发中');
};

const editPackage = (pkg: RechargePackage) => {
  ElMessage.info(`编辑套餐：充${pkg.amount}送${pkg.bonus}`);
};

const togglePackageStatus = async (pkg: RechargePackage) => {
  const action = pkg.status === 'active' ? '停用' : '启用';
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}此充值套餐吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    pkg.status = pkg.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`${action}成功`);
  } catch {
    // 用户取消操作
  }
};

const addCoupon = () => {
  ElMessage.info('发放优惠券功能开发中');
};

const viewCouponDetails = (coupon: Coupon) => {
  ElMessage.info(`查看优惠券详情：${coupon.name}`);
};

const stopCoupon = async (coupon: Coupon) => {
  try {
    await ElMessageBox.confirm(
      `确定要停止发放 ${coupon.name} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    ElMessage.success('已停止发放该优惠券');
  } catch {
    // 用户取消操作
  }
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

.package-item, .coupon-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.package-content, .coupon-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.package-info h4, .coupon-info h4 {
  margin: 0 0 4px 0;
  color: #333;
}

.package-info p, .coupon-info p {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 14px;
}

.coupon-validity {
  font-size: 12px;
  color: #999;
}

.coupon-stats .el-tag {
  margin-right: 8px;
}

.package-actions, .coupon-actions {
  text-align: right;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #52c41a;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}
</style>