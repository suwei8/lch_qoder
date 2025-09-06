import { ElMessage } from 'element-plus';

// 安全的API调用包装器
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  errorMessage: string = 'API调用失败，已切换到演示模式'
): Promise<T> => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('API调用失败:', error);
    ElMessage.warning(errorMessage);
    return fallbackData;
  }
};

// 带重试的API调用
export const safeApiCallWithRetry = async <T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  retries: number = 2,
  errorMessage: string = 'API调用失败，已切换到演示模式'
): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      if (i === retries) {
        console.error('API调用最终失败:', error);
        ElMessage.warning(errorMessage);
        return fallbackData;
      }
      console.warn(`API调用失败，正在重试 (${i + 1}/${retries + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return fallbackData;
};