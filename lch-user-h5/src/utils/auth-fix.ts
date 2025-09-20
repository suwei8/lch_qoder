// 临时认证修复方案
export const fixAuth = () => {
  // 设置一个临时的有效token用于开发测试
  const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAxIiwicGhvbmUiOiIxMzgwMDEzODAwMCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzM3MTc0MDAwLCJleHAiOjE3Mzc3Nzg4MDB9.test-signature'
  
  // 存储到localStorage
  localStorage.setItem('user_token', devToken)
  
  console.log('认证修复完成，已设置开发token')
  
  return devToken
}

// 检查认证状态
export const checkAuthStatus = () => {
  const token = localStorage.getItem('user_token')
  console.log('当前token状态:', token ? '已设置' : '未设置')
  return !!token
}