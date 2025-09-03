import StreamRequest, { createRealtimeStream, createSSEConnection } from './stream'

/**
 * 流式请求使用示例 - JSON数据同步版本
 * 这个文件展示了如何使用新的JSON流式请求工具进行页面实时同步
 */

// 示例1: 基本JSON流式请求
export async function exampleJSONStream() {
  console.log('=== JSON流式请求示例 ===')
  
  // 模拟页面状态
  const pageState = {
    messages: [] as any[],
    isLoading: true
  }

  const { cancel, receivedData } = StreamRequest.create('https://api.example.com/json-stream', {
    topic: 'chat',
    limit: 50
  }, {
    onMessage: (data) => {
      // 实时更新页面数据
      pageState.messages.push(data)
      console.log('实时消息:', data)
      
      // 这里可以触发Vue/React的响应式更新
      // this.messages = [...this.messages, data]
    },
    onError: (error) => {
      console.error('流错误:', error.message)
      pageState.isLoading = false
    },
    onComplete: () => {
      console.log('流完成，共接收:', receivedData.length, '条数据')
      pageState.isLoading = false
      console.log('所有数据:', receivedData)
    }
  })

  // 10秒后取消请求
  setTimeout(() => {
    console.log('手动取消请求，已接收:', receivedData.length, '条数据')
    cancel()
  }, 10000)
}

// 示例2: 实时数据看板
export async function exampleRealtimeDashboard() {
  console.log('=== 实时数据看板示例 ===')
  
  const dashboardData = {
    metrics: [] as any[],
    lastUpdate: new Date()
  }

  const { emitter } = createRealtimeStream('https://api.example.com/metrics', {
    interval: '1s'
  }, {
    onMessage: (metric) => {
      // 更新实时指标
      dashboardData.metrics.push(metric)
      dashboardData.lastUpdate = new Date()
      
      console.log('指标更新:', metric)
      // 触发UI更新: this.metrics = [...this.metrics, metric]
    }
  })

  // 监听更多事件
  emitter.on('complete', (allData) => {
    console.log('看板数据流完成，总计:', allData.length, '条指标')
  })
}

// 示例3: SSE聊天室
export async function exampleSSEChat() {
  console.log('=== SSE聊天室示例 ===')
  
  const chatState = {
    messages: [] as any[],
    users: new Set<string>()
  }

  const { receivedData } = createSSEConnection('https://api.example.com/chat/room/123', {
    userId: 'user-001'
  }, {
    onMessage: (chatEvent) => {
      switch (chatEvent.type) {
        case 'message':
          chatState.messages.push(chatEvent)
          console.log('新消息:', chatEvent.content)
          break
        case 'user_join':
          chatState.users.add(chatEvent.userId)
          console.log('用户加入:', chatEvent.userId)
          break
        case 'user_leave':
          chatState.users.delete(chatEvent.userId)
          console.log('用户离开:', chatEvent.userId)
          break
      }
      
      // Vue响应式更新示例:
      // this.messages = [...this.messages, chatEvent]
      // this.users = new Set([...this.users, chatEvent.userId])
    }
  })

  // 可以随时访问所有接收到的数据
  console.log('聊天记录:', receivedData)
}

// 示例4: 实时日志监控
export async function exampleLogMonitor() {
  console.log('=== 实时日志监控示例 ===')
  
  const logState = {
    logs: [] as any[],
    errorCount: 0,
    warningCount: 0
  }

  const { emitter } = StreamRequest.create('https://api.example.com/logs/tail', null, {
    onMessage: (logEntry) => {
      logState.logs.push(logEntry)
      
      // 统计日志级别
      if (logEntry.level === 'ERROR') logState.errorCount++
      if (logEntry.level === 'WARNING') logState.warningCount++
      
      console.log('日志:', logEntry.message)
      
      // 实时更新页面统计
      // this.errorCount = logState.errorCount
      // this.warningCount = logState.warningCount
      // this.logs = [...this.logs, logEntry]
    }
  })

  emitter.on('complete', (allLogs) => {
    console.log('日志监控结束，总计:', allLogs.length, '条日志')
    console.log('错误数:', logState.errorCount, '警告数:', logState.warningCount)
  })
}

// 示例5: 与Vue/React集成的示例
export function exampleVueIntegration() {
  console.log('=== Vue集成示例 (伪代码) ===')
  
  // Vue 3 Composition API 示例
  /*
  import { ref } from 'vue'
  import { createRealtimeStream } from '@/service/request/stream'
  
  export function useRealtimeData() {
    const messages = ref<any[]>([])
    const isLoading = ref(true)
    const error = ref<string | null>(null)
    
    const { cancel } = createRealtimeStream('/api/realtime-data', {}, {
      onMessage: (data) => {
        messages.value = [...messages.value, data]
      },
      onError: (err) => {
        error.value = err.message
        isLoading.value = false
      },
      onComplete: () => {
        isLoading.value = false
      }
    })
    
    return {
      messages,
      isLoading,
      error,
      cancel
    }
  }
  */
  
  console.log('Vue集成示例代码已注释，请取消注释并使用')
}

// 示例6: 数据持久化示例
export async function exampleWithPersistence() {
  console.log('=== 数据持久化示例 ===')
  
  const { receivedData, emitter } = StreamRequest.create('/api/stream-with-storage', null, {
    onMessage: (data) => {
      // 实时保存到localStorage
      const existingData = JSON.parse(localStorage.getItem('streamData') || '[]')
      existingData.push(data)
      localStorage.setItem('streamData', JSON.stringify(existingData))
      
      console.log('数据已保存:', data)
    }
  })

  emitter.on('complete', () => {
    console.log('所有数据已持久化，总计:', receivedData.length, '条')
    console.log('localStorage中的数据:', 
      JSON.parse(localStorage.getItem('streamData') || '[]').length)
  })
}

// 运行所有示例
export async function runAllExamples() {
  console.log('开始运行JSON流式请求示例')
  
  try {
    await exampleJSONStream()
    await exampleRealtimeDashboard()
    await exampleSSEChat()
    await exampleLogMonitor()
    exampleVueIntegration()
    await exampleWithPersistence()
    
    console.log('所有示例运行完成')
  } catch (error) {
    console.error('示例运行出错:', error)
  }
}

// 导出所有示例函数
export {
  exampleJSONStream,
  exampleRealtimeDashboard,
  exampleSSEChat,
  exampleLogMonitor,
  exampleVueIntegration,
  exampleWithPersistence,
  runAllExamples
}