/**
 * 日期时间格式化工具函数
 */

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
 */
export function formatDateTime(date: string | Date | number): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export function formatDate(date: string | Date | number): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间为 HH:mm 格式
 */
export function formatTime(date: string | Date | number): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${hours}:${minutes}`
}

/**
 * 格式化相对时间（如：刚刚、5分钟前、2小时前等）
 */
export function formatRelativeTime(date: string | Date | number): string {
  const d = new Date(date)
  const now = new Date()
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return formatDate(date)
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else if (seconds > 30) {
    return `${seconds}秒前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化月日时间（如：03-15 14:30）
 */
export function formatMonthDay(date: string | Date | number): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${month}-${day} ${hours}:${minutes}`
}

/**
 * 判断是否是今天
 */
export function isToday(date: string | Date | number): boolean {
  const d = new Date(date)
  const today = new Date()
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear()
}

/**
 * 判断是否是昨天
 */
export function isYesterday(date: string | Date | number): boolean {
  const d = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear()
}

/**
 * 智能格式化时间显示
 * 今天：显示时间 HH:mm
 * 昨天：昨天 HH:mm
 * 本年：MM-DD HH:mm
 * 其他：YYYY-MM-DD HH:mm
 */
export function formatSmartTime(date: string | Date | number): string {
  const d = new Date(date)
  const now = new Date()
  
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  if (isToday(date)) {
    return formatTime(date)
  } else if (isYesterday(date)) {
    return `昨天 ${formatTime(date)}`
  } else if (d.getFullYear() === now.getFullYear()) {
    return formatMonthDay(date)
  } else {
    return formatDateTime(date)
  }
}

/**
 * 格式化时长（秒）为可读格式
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  }
}