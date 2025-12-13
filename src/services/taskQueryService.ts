import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

/**
 * 任务查询响应
 */
export interface TaskQueryResponse {
  code: number
  message: string
  data?: {
    task_id: string
    task_status: string
    images?: string[]
    error?: string
  }
}

/**
 * 任务查询服务
 */
class TaskQueryService {
  /**
   * 查询任务状态
   */
  async queryTask(taskId: string): Promise<TaskQueryResponse> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/queryTaskWithoutToken`,
        {
          task_id: taskId,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data) {
        return response.data
      } else {
        throw new Error('查询任务状态失败')
      }
    } catch (error: any) {
      console.error('查询任务状态失败:', error)
      throw new Error(error.response?.data?.message || error.message || '查询任务状态失败')
    }
  }

  /**
   * 轮询任务状态直到完成
   */
  async pollTaskUntilComplete(
    taskId: string,
    options?: {
      interval?: number // 轮询间隔（毫秒），默认3000
      maxAttempts?: number // 最大轮询次数，默认40（2分钟）
      onProgress?: (status: string) => void // 进度回调
    }
  ): Promise<TaskQueryResponse> {
    const interval = options?.interval || 3000
    const maxAttempts = options?.maxAttempts || 40
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const result = await this.queryTask(taskId)

        if (result.data) {
          const status = result.data.task_status

          // 调用进度回调
          if (options?.onProgress) {
            options.onProgress(status)
          }

          // 任务失败，立即终止并抛出错误
          if (status === TaskStatus.FAILED) {
            const errorMsg = result.data.error || result.message || '图片生成失败'
            throw new Error(errorMsg)
          }

          // 任务成功，返回结果
          if (status === TaskStatus.SUCCEEDED) {
            return result
          }

          // 任务进行中，继续轮询
          if (status === TaskStatus.PENDING || status === TaskStatus.RUNNING) {
            await new Promise(resolve => setTimeout(resolve, interval))
            attempts++
            continue
          }
        }

        // 如果状态未知，继续轮询
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      } catch (error: any) {
        // 如果是任务失败错误，立即终止
        if (error.message && (error.message.includes('失败') || error.message.includes('FAILED'))) {
          throw error
        }
        
        console.error(`轮询任务失败 (${attempts + 1}/${maxAttempts}):`, error)
        // 其他错误继续轮询
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      }
    }

    // 超时
    throw new Error('任务查询超时，请稍后重试')
  }
}

export const taskQueryService = new TaskQueryService()

