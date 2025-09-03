import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { EventEmitter } from 'events'

/**
 * 流式请求选项
 */
export interface StreamRequestOptions<T = any> {
  /** 请求方法，默认为 GET */
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete'
  
  /** 接收到数据时的回调函数，数据会自动解析为JSON */
  onMessage?: (data: T) => void
  
  /** 发生错误时的回调函数 */
  onError?: (error: Error) => void
  
  /** 流结束时回调函数 */
  onComplete?: () => void
  
  /** 中止信号，用于取消请求 */
  signal?: AbortSignal
  
  /** 自定义axios配置 */
  axiosConfig?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'params' | 'signal' | 'responseType'>
  
  /** SSE数据分隔符，默认为 '\\n\\n' */
  delimiter?: string
  
  /** 是否自动解析JSON数据，默认为 true（强制为true） */
  autoParseJSON?: boolean
}

/**
 * 流式请求响应对象
 */
export interface StreamResponse<T = any> {
  /** 请求Promise */
  promise: Promise<void>
  
  /** 取消请求的函数 */
  cancel: () => void
  
  /** 事件发射器，用于更精细的事件监听 */
  emitter: EventEmitter
  
  /** 当前已接收到的所有数据（JSON数组） */
  receivedData: T[]
}

/**
 * 专门用于处理流式数据的请求工具
 * 支持Server-Sent Events (SSE)、分块传输编码等流式协议
 * 默认所有数据都会自动解析为JSON格式
 */
export class StreamRequest {
  /**
   * 创建流式请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 流式请求选项
   * @returns 流式请求响应对象
   */
  static create<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: StreamRequestOptions<T>
  ): StreamResponse<T> {
    const {
      method = 'get',
      onMessage,
      onError,
      onComplete,
      signal,
      axiosConfig = {},
      delimiter = '\n\n',
      autoParseJSON = true // 强制为true
    } = options || {}

    const emitter = new EventEmitter()
    const controller = signal ? undefined : new AbortController()
    const abortSignal = signal || controller?.signal
    
    // 存储所有接收到的数据
    const receivedData: T[] = []

    // 构建axios配置
    const config: AxiosRequestConfig = {
      url,
      method,
      signal: abortSignal,
      responseType: 'stream',
      ...axiosConfig
    }

    // 根据请求方法设置参数位置
    if (data) {
      if (method === 'get' || method === 'delete') {
        config.params = data
      } else {
        config.data = data
      }
    }

    let buffer = ''

    const promise = axios(config)
      .then((response: AxiosResponse) => {
        const stream = response.data

        // 监听数据事件
        stream.on('data', (chunk: Buffer) => {
          try {
            buffer += chunk.toString()
            
            // 处理完整的数据块
            let delimiterIndex: number
            while ((delimiterIndex = buffer.indexOf(delimiter)) !== -1) {
              const completeData = buffer.slice(0, delimiterIndex)
              buffer = buffer.slice(delimiterIndex + delimiter.length)
              
              const parsedData = this.processDataChunk<T>(completeData, {
                onMessage,
                emitter,
                receivedData
              })
              
              // 将解析后的数据添加到接收数组中
              if (parsedData) {
                receivedData.push(parsedData)
              }
            }
          } catch (error) {
            const err = error as Error
            onError?.(err)
            emitter.emit('error', err)
          }
        })

        // 监听流结束事件
        stream.on('end', () => {
          // 处理剩余的数据
          if (buffer.trim()) {
            const parsedData = this.processDataChunk<T>(buffer, {
              onMessage,
              emitter,
              receivedData
            })
            if (parsedData) {
              receivedData.push(parsedData)
            }
          }
          
          onComplete?.()
          emitter.emit('complete', receivedData)
        })

        // 监听错误事件
        stream.on('error', (error: Error) => {
          onError?.(error)
          emitter.emit('error', error)
        })

        return stream
      })
      .catch((error: Error) => {
        onError?.(error)
        emitter.emit('error', error)
        throw error
      })

    return {
      promise: promise.then(() => {}).catch(() => {}),
      cancel: () => controller?.abort(),
      emitter,
      receivedData
    }
  }

  /**
   * 处理数据块并返回解析后的数据
   */
  private static processDataChunk<T>(
    data: string,
    options: {
      onMessage?: (data: T) => void
      emitter: EventEmitter
      receivedData: T[]
    }
  ): T | null {
    const { onMessage, emitter } = options
    
    const lines = data.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      try {
        let jsonData: string
        
        // 处理SSE格式: data: {...}
        if (trimmedLine.startsWith('data: ')) {
          jsonData = trimmedLine.slice(6).trim()
        } else {
          jsonData = trimmedLine
        }

        if (jsonData) {
          // 强制解析为JSON
          const parsedData = JSON.parse(jsonData) as T
          
          // 触发回调
          onMessage?.(parsedData)
          emitter.emit('message', parsedData)
          
          return parsedData
        }
      } catch (error) {
        // JSON解析错误，尝试处理为纯文本
        try {
          const fallbackData = { message: trimmedLine, raw: true } as unknown as T
          onMessage?.(fallbackData)
          emitter.emit('message', fallbackData)
          return fallbackData
        } catch (fallbackError) {
          const err = new Error(`Failed to parse stream data: ${trimmedLine.substring(0, 100)}...`)
          options.emitter.emit('parse_error', err, trimmedLine)
        }
      }
    }
    
    return null
  }

  /**
   * 快捷方法：创建SSE连接（JSON格式）
   */
  static sse<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: Omit<StreamRequestOptions<T>, 'delimiter' | 'autoParseJSON'>
  ): StreamResponse<T> {
    return this.create(url, data, {
      ...options,
      delimiter: '\n\n',
      autoParseJSON: true
    })
  }

  /**
   * 快捷方法：创建分块传输编码连接（JSON格式）
   */
  static chunked<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: Omit<StreamRequestOptions<T>, 'autoParseJSON'>
  ): StreamResponse<T> {
    return this.create(url, data, {
      ...options,
      delimiter: '\n',
      autoParseJSON: true
    })
  }

  /**
   * 创建实时数据流，适合页面实时更新
   */
  static realtime<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: Omit<StreamRequestOptions<T>, 'autoParseJSON'>
  ): StreamResponse<T> {
    return this.create(url, data, {
      ...options,
      delimiter: '\n',
      autoParseJSON: true
    })
  }
}

/**
 * 默认导出StreamRequest类
 */
export default StreamRequest

/**
 * 快捷函数：创建流式请求（JSON格式）
 */
export function createStreamRequest<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<StreamRequestOptions<T>, 'autoParseJSON'>
): StreamResponse<T> {
  return StreamRequest.create(url, data, {
    ...options,
    autoParseJSON: true
  })
}

/**
 * 快捷函数：创建SSE连接（JSON格式）
 */
export function createSSEConnection<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<StreamRequestOptions<T>, 'delimiter' | 'autoParseJSON'>
): StreamResponse<T> {
  return StreamRequest.sse(url, data, options)
}

/**
 * 快捷函数：创建分块传输连接（JSON格式）
 */
export function createChunkedConnection<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<StreamRequestOptions<T>, 'autoParseJSON'>
): StreamResponse<T> {
  return StreamRequest.chunked(url, data, options)
}

/**
 * 快捷函数：创建实时数据流（JSON格式），适合页面实时更新
 */
export function createRealtimeStream<T = any>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<StreamRequestOptions<T>, 'autoParseJSON'>
): StreamResponse<T> {
  return StreamRequest.realtime(url, data, options)
}