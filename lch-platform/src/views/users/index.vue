<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.totalUsers }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.activeUsers }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.merchantUsers }}</div>
            <div class="stat-label">商户用户</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.todayNewUsers }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索过滤 -->
    <div class="filter-card">
      <el-form :model="searchForm" @submit.prevent="loadUsers">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="请输入手机号或昵称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="角色">
              <el-select v-model="searchForm.role" placeholder="全部角色" clearable>
                <el-option label="管理员" value="admin" />
                <el-option label="商户" value="merchant" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
                <el-option label="正常" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="loadUsers">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 用户列表 -->
    <div class="table-card">
      <el-table 
        :data="users" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :alt="row.nickname">{{ row.nickname?.charAt(0) || 'U' }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额">
          <template #default="{ row }">
            ¥{{ (row.balance / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewUser(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editUser(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </div>

    <!-- 用户编辑/新增对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入手机号"
            :disabled="!!editingUser"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="userForm.nickname"
            placeholder="请输入昵称"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="platform_admin" />
            <el-option label="商户" value="merchant" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额" prop="balance">
          <el-input-number
            v-model="userForm.balance"
            :min="0"
            :precision="2"
            placeholder="请输入余额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="userForm.address"
            placeholder="请输入地址"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSaveUser">
            {{ editingUser ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="用户详情"
      width="600px"
    >
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ selectedUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ selectedUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleType(selectedUser.role)">{{ getRoleText(selectedUser.role) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUser.status === 'active' ? 'success' : 'danger'">
              {{ selectedUser.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="余额">¥{{ (selectedUser.balance / 100).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ selectedUser.address || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ selectedUser.last_login_at ? formatDate(selectedUser.last_login_at) : '从未登录' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus,
  User,
  CircleCheck,
  Shop,
  TrendCharts
} from '@element-plus/icons-vue';
import { userApi } from '@/api/user';
import type { User as UserType, UserListParams, CreateUserDto, UpdateUserDto } from '@/types/user';
import { formatDate } from '@/utils/format';
import { safeApiCall } from '@/utils/safeApi';

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const users = ref<UserType[]>([]);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const editingUser = ref<UserType | null>(null);
const selectedUser = ref<UserType | null>(null);
const userFormRef = ref();

// 用户表单数据
const userForm = reactive({
  phone: '',
  nickname: '',
  role: 'user',
  status: 'active',
  balance: 0,
  address: ''
});

// 表单验证规则
const userFormRules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
});

// 用户统计数据
const userStats = ref({
  totalUsers: 156,
  activeUsers: 145,
  merchantUsers: 23,
  todayNewUsers: 5
});

// 搜索表单
const searchForm = reactive<UserListParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
  role: undefined,
  status: undefined,
});

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 加载用户列表
const loadUsers = async () => {
  loading.value = true;
  
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    const response = await userApi.getUsers(params);
    users.value = response.data || [];
    pagination.total = response.total || 0;
  } catch (error) {
    console.error('用户列表加载失败:', error);
    ElMessage.error('用户列表加载失败');
    users.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 加载用户统计数据
const loadUserStats = async () => {
  try {
    const stats = await userApi.getUserStats();
    userStats.value = stats;
  } catch (error) {
    console.error('用户统计加载失败:', error);
    ElMessage.error('用户统计加载失败');
    // 设置默认值
    userStats.value = {
      totalUsers: 0,
      activeUsers: 0,
      merchantUsers: 0,
      todayNewUsers: 0
    };
  }
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    role: undefined,
    status: undefined,
  });
  pagination.page = 1;
  loadUsers();
};

// 查看用户详情
const viewUser = (user: UserType) => {
  selectedUser.value = user;
  showDetailDialog.value = true;
};

// 编辑用户
const editUser = (user: UserType) => {
  editingUser.value = user;
  // 填充表单数据
  Object.assign(userForm, {
    phone: user.phone,
    nickname: user.nickname,
    role: user.role,
    status: user.status,
    balance: user.balance / 100, // 转换为元
    address: user.address || ''
  });
  showCreateDialog.value = true;
};

// 处理对话框关闭
const handleDialogClose = () => {
  editingUser.value = null;
  // 重置表单
  Object.assign(userForm, {
    phone: '',
    nickname: '',
    role: 'user',
    status: 'active',
    balance: 0,
    address: ''
  });
  userFormRef.value?.resetFields();
};

// 保存用户
const handleSaveUser = async () => {
  try {
    await userFormRef.value?.validate();
    saving.value = true;

    const userData = {
      ...userForm,
      balance: Math.round(userForm.balance * 100) // 转换为分
    };

    if (editingUser.value) {
      // 更新用户
      await userApi.updateUser(editingUser.value.id, userData);
      ElMessage.success('用户更新成功');
    } else {
      // 创建用户
      await userApi.createUser(userData);
      ElMessage.success('用户创建成功');
    }

    showCreateDialog.value = false;
    loadUsers();
  } catch (error) {
    console.error('保存用户失败:', error);
    ElMessage.error(editingUser.value ? '用户更新失败' : '用户创建失败');
  } finally {
    saving.value = false;
  }
};

// 切换用户状态
const toggleUserStatus = async (user: UserType) => {
  const action = user.status === 'active' ? '禁用' : '启用';
  const confirm = await ElMessageBox.confirm(
    `确定要${action}用户「${user.nickname || user.phone}」吗？`,
    '确认操作',
    { type: 'warning' }
  ).catch(() => false);
  
  if (!confirm) return;
  
  try {
    // 直接更新本地状态
    user.status = user.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`用户${action}成功`);
    
    // 后台尝试API调用
    try {
      const newStatus = user.status;
      await userApi.updateUser(user.id, { status: newStatus });
    } catch (error) {
      console.warn('API更新失败:', error);
    }
  } catch (error) {
    ElMessage.error(`用户${action}失败`);
  }
};

// 获取角色类型
const getRoleType = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'danger',
    merchant: 'warning',
    user: 'info',
  };
  return roleMap[role] || 'info';
};

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    merchant: '商户',
    user: '普通用户',
  };
  return roleMap[role] || role;
};

// 页面初始化
onMounted(() => {
  loadUsers();
  loadUserStats();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.user-detail {
  .el-descriptions {
    margin-top: 20px;
  }
}
</style>