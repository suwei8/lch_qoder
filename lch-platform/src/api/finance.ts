import request from '@/utils/request'

// 财务统计数据接口
export interface FinanceStats {
  totalRevenue: string
  todayRevenue: string
  pendingSettlement: string
  totalTransactions: number
}

// 财务记录接口
export interface FinanceRecord {
  id: number
  order_id: string
  merchant_name: string
  type: 'income' | 'refund' | 'settlement'
  amount: number
  platform_fee: number
  merchant_amount: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  remark?: string
}

// 图表数据接口
export interface ChartData {
  date: string
  revenue: string
  orders: number
}

// 获取财务统计数据
export function getFinanceStats() {
  return request({
    url: '/finance/stats',
    method: 'get'
  }) as Promise<FinanceStats>
}

// 获取财务记录列表
export function getFinanceRecords(params: {
  page?: number
  limit?: number
  type?: string
  startDate?: string
  endDate?: string
}) {
  return request({
    url: '/finance/records',
    method: 'get',
    params
  }) as Promise<{
    records: FinanceRecord[]
    total: number
    page: number
    limit: number
  }>
}

// 获取财务图表数据
export function getFinanceCharts(days = 7) {
  return request({
    url: '/finance/charts',
    method: 'get',
    params: { days }
  }) as Promise<ChartData[]>
}