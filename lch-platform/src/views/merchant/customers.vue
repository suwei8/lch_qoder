<template>
  <div class="page-container">
    <el-card class="page-header" shadow="never">
      <h2>客户管理</h2>
      <p>管理注册用户、查看消费记录、客户标签分组</p>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>客户列表</span>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索客户手机号/昵称"
              style="width: 240px; margin-right: 12px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary">导出客户数据</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredCustomers" style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="balance" label="账户余额" width="100">
          <template #default="{ row }">
            <span style="color: #52c41a;">¥{{ row.balance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="giftBalance" label="赠送余额" width="100">
          <template #default="{ row }">
            <span style="color: #fa8c16;">¥{{ row.giftBalance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalConsumption" label="累计消费" width="120">
          <template #default="{ row }">
            <span>¥{{ row.totalConsumption.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewCustomerDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="rechargeCustomer(row)">充值</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleCustomerStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCustomers"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; text-align: right;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface Customer {
  id: number;
  nickname: string;
  phone: string;
  balance: number;
  giftBalance: number;
  totalConsumption: number;
  lastLoginTime: string;
  status: 'active' | 'disabled';
}

const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCustomers = ref(0);

// 模拟客户数据
const customers = ref<Customer[]>([
  {
    id: 1001,
    nickname: '张先生',
    phone: '138****8888',
    balance: 123.45,
    giftBalance: 20.00,
    totalConsumption: 456.78,
    lastLoginTime: '2024-01-15 14:30:22',
    status: 'active',
  },
  {
    id: 1002,
    nickname: '李女士',
    phone: '139****9999',
    balance: 89.20,
    giftBalance: 15.00,
    totalConsumption: 234.56,
    lastLoginTime: '2024-01-14 09:15:18',
    status: 'active',
  },
  {
    id: 1003,
    nickname: '王总',
    phone: '188****1234',
    balance: 567.89,
    giftBalance: 50.00,
    totalConsumption: 1234.56,
    lastLoginTime: '2024-01-16 16:45:30',
    status: 'active',
  },
  {
    id: 1004,
    nickname: '刘师傅',
    phone: '156****5678',
    balance: 0.00,
    giftBalance: 0.00,
    totalConsumption: 78.90,
    lastLoginTime: '2024-01-10 11:20:15',
    status: 'disabled',
  },
]);

const filteredCustomers = computed(() => {
  if (!searchKeyword.value) return customers.value;
  
  return customers.value.filter(customer =>
    customer.nickname.includes(searchKeyword.value) ||
    customer.phone.includes(searchKeyword.value)
  );
});

const handleSearch = () => {
  currentPage.value = 1;
};

const viewCustomerDetail = (customer: Customer) => {
  ElMessage.info(`查看客户 ${customer.nickname} 的详细信息`);
};

const rechargeCustomer = async (customer: Customer) => {
  try {
    const { value: amount } = await ElMessageBox.prompt(
      `为客户 ${customer.nickname} 充值`,
      '充值金额',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+(\.\d{1,2})?$/,
        inputErrorMessage: '请输入正确的金额',
      }
    );
    
    if (amount) {
      customer.balance += parseFloat(amount);
      ElMessage.success(`充值成功！为客户 ${customer.nickname} 充值 ¥${amount}`);
    }
  } catch {
    // 用户取消操作
  }
};

const toggleCustomerStatus = async (customer: Customer) => {
  const action = customer.status === 'active' ? '禁用' : '启用';
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}客户 ${customer.nickname} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    customer.status = customer.status === 'active' ? 'disabled' : 'active';
    ElMessage.success(`${action}成功`);
  } catch {
    // 用户取消操作
  }
};

onMounted(() => {
  totalCustomers.value = customers.value.length;
});
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
</style>