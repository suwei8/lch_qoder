import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { orderApi } from '@/api/order';
import { exportApi } from '@/api/export';
import type { Order } from '@/types/order';

export function useOrderManagement() {
  const loading = ref(false);
  const selectedOrders = ref<Order[]>([]);

  // 批量操作
  const batchOperations = reactive({
    cancel: async (orders: Order[], reason: string) => {
      loading.value = true;
      try {
        const promises = orders.map(order => 
          orderApi.cancelOrder(order.id, { reason })
        );
        await Promise.all(promises);
        ElMessage.success(`成功取消 ${orders.length} 个订单`);
        return true;
      } catch (error) {
        ElMessage.error('批量取消失败');
        return false;
      } finally {
        loading.value = false;
      }
    },

    refund: async (orders: Order[], reason: string) => {
      loading.value = true;
      try {
        const promises = orders.map(order => 
          orderApi.refundOrder(order.id, { reason })
        );
        await Promise.all(promises);
        ElMessage.success(`成功申请 ${orders.length} 个订单退款`);
        return true;
      } catch (error) {
        ElMessage.error('批量退款失败');
        return false;
      } finally {
        loading.value = false;
      }
    },

    complete: async (orders: Order[]) => {
      loading.value = true;
      try {
        const promises = orders.map(order => 
          orderApi.finishOrder(order.id)
        );
        await Promise.all(promises);
        ElMessage.success(`成功完成 ${orders.length} 个订单`);
        return true;
      } catch (error) {
        ElMessage.error('批量完成失败');
        return false;
      } finally {
        loading.value = false;
      }
    }
  });

  // 导出功能
  const exportOperations = {
    orders: async (params: any) => {
      try {
        loading.value = true;
        const blob = await exportApi.exportOrders(params);
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `订单数据_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success('订单数据导出成功');
      } catch (error) {
        ElMessage.error('导出失败');
      } finally {
        loading.value = false;
      }
    },

    refundReport: async (params: any) => {
      try {
        loading.value = true;
        const blob = await exportApi.exportRefundReport(params);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `退款报告_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success('退款报告导出成功');
      } catch (error) {
        ElMessage.error('导出失败');
      } finally {
        loading.value = false;
      }
    }
  };

  // 异常订单检测
  const detectAbnormalOrders = async () => {
    try {
      const response = await orderApi.getOrders({
        status: undefined,
        page: 1,
        limit: 1000
      });
      
      const abnormalOrders = response.data.filter(order => {
        const now = new Date();
        const createdAt = new Date(order.created_at);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        // 检测异常情况
        return (
          // 支付超时 (15分钟)
          (order.status === 'pending' && hoursDiff > 0.25) ||
          // 启动超时 (5分钟)
          (order.status === 'paid' && hoursDiff > 0.083) ||
          // 使用超时 (超过预定时长2倍)
          (order.status === 'started' && hoursDiff > (order.duration_minutes * 2 / 60)) ||
          // 结算超时 (1小时)
          (order.status === 'settling' && hoursDiff > 1)
        );
      });
      
      return abnormalOrders;
    } catch (error) {
      console.error('检测异常订单失败:', error);
      return [];
    }
  };

  return {
    loading,
    selectedOrders,
    batchOperations,
    exportOperations,
    detectAbnormalOrders
  };
}