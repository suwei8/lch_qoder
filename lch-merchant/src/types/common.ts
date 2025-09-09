// 公共类型定义

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// 分页响应
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// 时间范围
export interface TimeRange {
  startTime?: string;
  endTime?: string;
}

// 统计数据接口
export interface StatsData {
  value: number;
  label: string;
  change?: number;
  changeRate?: string;
}

// 图表数据接口
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

// 选项接口
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// 表单验证规则
export interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: any, value: any, callback: Function) => void;
}