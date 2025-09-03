import { request } from './index'

/**
 * 极简HTTP请求封装
 * 只需要传入url和data，其他配置使用index.ts中的默认设置
 */

/**
 * GET请求
 * @param url 请求URL
 * @param data 请求参数
 * @returns Promise响应数据
 */
export async function get<T>(url: string, data?: Record<string, any>): Promise<T> {
  const result = await request<T>({
    url,
    method: 'get',
    params: data
  })
  
  if (result.error) {
    throw result.error
  }
  
  return result.data
}

/**
 * POST请求
 * @param url 请求URL
 * @param data 请求数据
 * @returns Promise响应数据
 */
export async function post<T>(url: string, data?: Record<string, any>): Promise<T> {
  const result = await request<T>({
    url,
    method: 'post',
    data
  })
  
  if (result.error) {
    throw result.error
  }
  
  return result.data
}

/**
 * PUT请求
 * @param url 请求URL
 * @param data 请求数据
 * @returns Promise响应数据
 */
export async function put<T>(url: string, data?: Record<string, any>): Promise<T> {
  const result = await request<T>({
    url,
    method: 'put',
    data
  })
  
  if (result.error) {
    throw result.error
  }
  
  return result.data
}

/**
 * DELETE请求
 * @param url 请求URL
 * @param data 请求参数
 * @returns Promise响应数据
 */
export async function del<T>(url: string, data?: Record<string, any>): Promise<T> {
  const result = await request<T>({
    url,
    method: 'delete',
    params: data
  })
  
  if (result.error) {
    throw result.error
  }
  
  return result.data
}

/**
 * PATCH请求
 * @param url 请求URL
 * @param data 请求数据
 * @returns Promise响应数据
 */
export async function patch<T>(url: string, data?: Record<string, any>): Promise<T> {
  const result = await request<T>({
    url,
    method: 'patch',
    data
  })
  
  if (result.error) {
    throw result.error
  }
  
  return result.data
}

/**
 * 默认导出所有HTTP方法
 */
export default {
  get,
  post,
  put,
  del,
  patch
}