<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Setting /></el-icon>
        新增配置
      </el-button>
    </div>

    <!-- 配置分类卡片 -->
    <div class="config-categories">
      <el-card 
        v-for="(configs, category) in groupedConfigs" 
        :key="category"
        class="category-card"
        :class="{ active: activeCategory === category }"
        @click="activeCategory = category"
      >
        <div class="category-header">
          <h3>{{ getCategoryName(category) }}</h3>
          <el-badge :value="configs.length" type="primary" />
        </div>
        <p class="category-desc">{{ getCategoryDesc(category) }}</p>
      </el-card>
    </div>

    <!-- 配置项列表 -->
    <el-card v-if="activeCategory">
      <template #header>
        <div class="config-header">
          <h3>{{ getCategoryName(activeCategory) }}</h3>
          <el-input
            v-model="searchText"
            placeholder="搜索配置项..."
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <div class="config-list">
        <div 
          v-for="config in filteredConfigs" 
          :key="config.id"
          class="config-item"
        >
          <div class="config-info">
            <div class="config-key">
              <span class="key-text">{{ config.config_key }}</span>
              <el-tag v-if="config.is_public" type="success" size="small">公开</el-tag>
              <el-tag v-if="!config.is_editable" type="warning" size="small">只读</el-tag>
            </div>
            <div class="config-desc">{{ config.description || '暂无描述' }}</div>
            <div class="config-type">
              <el-tag :type="getTypeTag(config.config_type)" size="small">
                {{ getTypeText(config.config_type) }}
              </el-tag>
            </div>
          </div>
          <div class="config-value">
            <div v-if="editingConfig === config.id" class="edit-mode">
              <el-input
                v-if="config.config_type === 'string'"
                v-model="editValue"
                @keyup.enter="saveConfig(config)"
                @keyup.esc="cancelEdit"
              />
              <el-input-number
                v-else-if="config.config_type === 'number'"
                v-model="editValue"
                style="width: 200px"
                @keyup.enter="saveConfig(config)"
              />
              <el-switch
                v-else-if="config.config_type === 'boolean'"
                v-model="editValue"
                @change="saveConfig(config)"
              />
              <el-input
                v-else
                v-model="editValue"
                type="textarea"
                :rows="3"
                @keyup.enter="saveConfig(config)"
                @keyup.esc="cancelEdit"
              />
              <div class="edit-actions" v-if="config.config_type !== 'boolean'">
                <el-button size="small" @click="saveConfig(config)" :loading="saving">保存</el-button>
                <el-button size="small" @click="cancelEdit">取消</el-button>
              </div>
            </div>
            <div v-else class="display-mode">
              <div class="value-display">
                <span v-if="config.config_type === 'boolean'">
                  <el-tag :type="config.config_value === 'true' ? 'success' : 'danger'">
                    {{ config.config_value === 'true' ? '是' : '否' }}
                  </el-tag>
                </span>
                <span v-else-if="config.config_type === 'json'" class="json-value">
                  <code>{{ formatJsonValue(config.config_value) }}</code>
                </span>
                <span v-else class="text-value">{{ config.config_value }}</span>
              </div>
              <div class="value-actions">
                <el-button 
                  v-if="config.is_editable"
                  size="small" 
                  type="primary" 
                  @click="editConfig(config)"
                >
                  编辑
                </el-button>
                <el-button 
                  v-if="config.is_editable"
                  size="small" 
                  @click="resetConfig(config)"
                >
                  重置
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteConfigItem(config)"
                  :disabled="!config.is_editable"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="!filteredConfigs.length" description="暂无配置项" />
      </div>
    </el-card>

    <!-- 新增配置对话框 -->
    <el-dialog
      title="新增系统配置"
      v-model="showCreateDialog"
      width="600px"
    >
      <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="120px">
        <el-form-item label="配置键" prop="config_key">
          <el-input v-model="configForm.config_key" placeholder="请输入配置键，如: app_name" />
        </el-form-item>
        <el-form-item label="配置值" prop="config_value">
          <el-input
            v-if="configForm.config_type === 'string'"
            v-model="configForm.config_value"
            placeholder="请输入配置值"
          />
          <el-input-number
            v-else-if="configForm.config_type === 'number'"
            v-model="configForm.config_value"
            style="width: 100%"
          />
          <el-switch
            v-else-if="configForm.config_type === 'boolean'"
            v-model="configForm.config_value"
          />
          <el-input
            v-else
            v-model="configForm.config_value"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的配置值"
          />
        </el-form-item>
        <el-form-item label="配置类型" prop="config_type">
          <el-select v-model="configForm.config_type" @change="onTypeChange">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置分类" prop="category">
          <el-select v-model="configForm.category" allow-create filterable>
            <el-option label="通用设置" value="general" />
            <el-option label="支付设置" value="payment" />
            <el-option label="设备设置" value="device" />
            <el-option label="营销设置" value="promotion" />
            <el-option label="通知设置" value="notification" />
            <el-option label="微信设置" value="wechat" />
            <el-option label="系统设置" value="system" />
            <el-option label="联系方式" value="contact" />
            <el-option label="财务设置" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置描述">
          <el-input 
            v-model="configForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入配置项的描述信息"
          />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="configForm.is_public" />
          <span class="form-hint">公开的配置项可以被前端访问</span>
        </el-form-item>
        <el-form-item label="是否可编辑">
          <el-switch v-model="configForm.is_editable" />
          <span class="form-hint">不可编辑的配置项无法修改或删除</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createConfig" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Setting, Search } from '@element-plus/icons-vue';
import {
  getGroupedConfigs,
  createConfig as createConfigAPI,
  updateConfig,
  resetConfig as resetConfigAPI,
  deleteConfig,
  type SystemConfig,
  type GroupedConfigs
} from '@/api/system-config';

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const activeCategory = ref('');
const searchText = ref('');
const editingConfig = ref<number | null>(null);
const editValue = ref<any>('');
const groupedConfigs = ref<GroupedConfigs>({});

// 表单数据
const configForm = reactive({
  config_key: '',
  config_value: '',
  config_type: 'string' as 'string' | 'number' | 'boolean' | 'json',
  category: 'general',
  description: '',
  is_public: false,
  is_editable: true
});

// 表单验证规则
const configRules = {
  config_key: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    { pattern: /^[a-z_][a-z0-9_]*$/i, message: '配置键只能包含字母、数字和下划线，且以字母或下划线开头', trigger: 'blur' }
  ],
  config_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  config_type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择配置分类', trigger: 'change' }]
};

const configFormRef = ref();

// 计算属性
const filteredConfigs = computed(() => {
  if (!activeCategory.value || !groupedConfigs.value[activeCategory.value]) {
    return [];
  }
  
  const configs = groupedConfigs.value[activeCategory.value];
  if (!searchText.value) {
    return configs;
  }
  
  return configs.filter(config => 
    config.config_key.toLowerCase().includes(searchText.value.toLowerCase()) ||
    (config.description && config.description.toLowerCase().includes(searchText.value.toLowerCase()))
  );
});

// 工具函数
const getCategoryName = (category: string) => {
  const map = {
    general: '通用设置',
    payment: '支付设置',
    device: '设备设置',
    promotion: '营销设置',
    notification: '通知设置',
    wechat: '微信设置',
    system: '系统设置',
    contact: '联系方式',
    finance: '财务设置'
  };
  return map[category] || category;
};

const getCategoryDesc = (category: string) => {
  const map = {
    general: '应用基础配置信息',
    payment: '支付相关配置',
    device: '设备管理配置',
    promotion: '营销活动配置',
    notification: '消息通知配置',
    wechat: '微信平台配置',
    system: '系统运行配置',
    contact: '联系方式配置',
    finance: '财务结算配置'
  };
  return map[category] || '其他配置';
};

const getTypeText = (type: string) => {
  const map = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    json: 'JSON'
  };
  return map[type] || type;
};

const getTypeTag = (type: string) => {
  const map = {
    string: 'primary',
    number: 'success',
    boolean: 'warning',
    json: 'info'
  };
  return map[type] || '';
};

const formatJsonValue = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

// 业务方法
const loadConfigs = async () => {
  loading.value = true;
  try {
    const { data } = await getGroupedConfigs();
    groupedConfigs.value = data || {};
    
    // 设置默认激活分类
    if (!activeCategory.value && Object.keys(groupedConfigs.value).length > 0) {
      activeCategory.value = Object.keys(groupedConfigs.value)[0];
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
};

const onTypeChange = () => {
  if (configForm.config_type === 'boolean') {
    configForm.config_value = false;
  } else if (configForm.config_type === 'number') {
    configForm.config_value = 0;
  } else {
    configForm.config_value = '';
  }
};

const resetForm = () => {
  Object.assign(configForm, {
    config_key: '',
    config_value: '',
    config_type: 'string',
    category: 'general',
    description: '',
    is_public: false,
    is_editable: true
  });
};

const createConfig = async () => {
  if (!configFormRef.value) return;
  
  try {
    await configFormRef.value.validate();
    creating.value = true;

    let configValue = configForm.config_value;
    if (configForm.config_type === 'json') {
      try {
        JSON.parse(configValue);
      } catch {
        ElMessage.error('JSON格式不正确');
        return;
      }
    }

    await createConfigAPI({
      ...configForm,
      config_value: String(configValue)
    });

    ElMessage.success('创建成功');
    showCreateDialog.value = false;
    resetForm();
    loadConfigs();
  } catch (error) {
    console.error('创建失败:', error);
    ElMessage.error('创建失败');
  } finally {
    creating.value = false;
  }
};

const editConfig = (config: SystemConfig) => {
  editingConfig.value = config.id;
  
  if (config.config_type === 'boolean') {
    editValue.value = config.config_value === 'true';
  } else if (config.config_type === 'number') {
    editValue.value = Number(config.config_value);
  } else {
    editValue.value = config.config_value;
  }
};

const cancelEdit = () => {
  editingConfig.value = null;
  editValue.value = '';
};

const saveConfig = async (config: SystemConfig) => {
  try {
    saving.value = true;
    
    let value = editValue.value;
    if (config.config_type === 'json' && typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch {
        ElMessage.error('JSON格式不正确');
        return;
      }
    }

    await updateConfig(config.config_key, value);
    ElMessage.success('更新成功');
    
    editingConfig.value = null;
    editValue.value = '';
    loadConfigs();
  } catch (error) {
    console.error('更新失败:', error);
    ElMessage.error('更新失败');
  } finally {
    saving.value = false;
  }
};

const resetConfig = async (config: SystemConfig) => {
  try {
    await ElMessageBox.confirm('确定要重置这个配置项到默认值吗？', '确认重置', {
      type: 'warning'
    });
    
    await resetConfigAPI(config.config_key);
    ElMessage.success('重置成功');
    loadConfigs();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置失败:', error);
      ElMessage.error('重置失败');
    }
  }
};

const deleteConfigItem = async (config: SystemConfig) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配置项吗？', '确认删除', {
      type: 'warning'
    });
    
    await deleteConfig(config.config_key);
    ElMessage.success('删除成功');
    loadConfigs();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 生命周期
onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.system-config {
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

.config-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.category-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.category-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}

.category-card.active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #f5f9ff 0%, #e8f4ff 100%);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.category-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.category-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h3 {
  margin: 0;
  color: #303133;
}

.config-list {
  max-height: 600px;
  overflow-y: auto;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.config-item:last-child {
  border-bottom: none;
}

.config-info {
  flex: 1;
  margin-right: 20px;
}

.config-key {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.key-text {
  font-weight: bold;
  color: #303133;
  font-family: monospace;
}

.config-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.config-type {
  margin-bottom: 8px;
}

.config-value {
  min-width: 300px;
}

.display-mode {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.value-display {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.text-value {
  font-family: monospace;
  color: #303133;
}

.json-value code {
  background: none;
  padding: 0;
  color: #303133;
  white-space: pre-wrap;
  font-size: 12px;
}

.value-actions {
  display: flex;
  gap: 8px;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.form-hint {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}
</style>