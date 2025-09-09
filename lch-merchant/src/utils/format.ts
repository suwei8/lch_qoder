/**
 * 日期时间格式化工具
 * @author Lily
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 * @param date 日期对象或字符串
 * @param format 格式化模板，默认：YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export const formatDateTime = (date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param date 日期对象或字符串
 * @param format 格式化模板，默认：YYYY-MM-DD
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化时间
 * @param date 日期对象或字符串
 * @param format 格式化模板，默认：HH:mm:ss
 * @returns 格式化后的时间字符串
 */
export const formatTime = (date: Date | string, format = 'HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 相对时间格式化
 * @param date 日期对象或字符串
 * @returns 相对时间字符串（如：2小时前）
 */
export const formatRelativeTime = (date: Date | string): string => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

/**
 * 获取相对时间（别名）
 * @param date 日期对象或字符串
 * @returns 相对时间字符串（如：2小时前）
 */
export const getRelativeTime = formatRelativeTime