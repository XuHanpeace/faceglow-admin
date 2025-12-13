import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'
import { taskQueryService } from './taskQueryService'

/**
 * 万相文生图接口参数
 */
export interface ImageGenerationParams {
  prompt: string // 提示词
  negative_prompt?: string // 负面提示词
  width?: number // 图片宽度，默认1024
  height?: number // 图片高度，默认1024
  num_images?: number // 生成图片数量，默认1
  style?: string // 风格
}

/**
 * 万相文生图响应
 */
export interface ImageGenerationResponse {
  code: number
  message: string
  data?: {
    images: string[] // base64图片数组
    task_id?: string
  }
}

/**
 * 图片生成服务
 */
class ImageGenerationService {
  /**
   * 调用百炼文生图接口生成图片（返回taskId）
   */
  async generateImages(params: ImageGenerationParams): Promise<{ code: number; message: string; data?: { task_id: string; request_id: string } }> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/generateImages`,
        {
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || '',
          width: params.width || 1024,
          height: params.height || 1024,
          num_images: params.num_images || 1,
        },
        {
          timeout: 30000, // 30秒超时（只提交任务，不等待结果）
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data
      } else {
        throw new Error(response.data?.message || '提交图片生成任务失败')
      }
    } catch (error: any) {
      console.error('提交图片生成任务失败:', error)
      throw new Error(error.response?.data?.message || error.message || '提交图片生成任务失败')
    }
  }

  /**
   * 生成图片并等待完成（包含轮询）
   */
  async generateImagesAndWait(
    params: ImageGenerationParams,
    onProgress?: (status: string) => void
  ): Promise<ImageGenerationResponse> {
    try {
      // 1. 提交任务，获取taskId
      const submitResponse = await this.generateImages(params)
      
      if (!submitResponse.data?.task_id) {
        throw new Error('未获取到taskId')
      }

      const taskId = submitResponse.data.task_id

      // 2. 轮询任务状态直到完成
      const queryResponse = await taskQueryService.pollTaskUntilComplete(taskId, {
        interval: 3000, // 每3秒轮询一次
        maxAttempts: 40, // 最多轮询40次（2分钟）
        onProgress,
      })

      if (queryResponse.data?.task_status === 'SUCCEEDED' && queryResponse.data.images) {
        // 如果返回的是URL，需要转换为base64
        const imageUrls = queryResponse.data.images
        const base64Images = await Promise.all(
          imageUrls.map(async (url: string) => {
            if (!url) return ''
            if (url.startsWith('data:')) {
              // 已经是base64格式
              return url
            }
            try {
              // 下载图片并转换为base64
              const response = await fetch(url)
              const blob = await response.blob()
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
            } catch (error) {
              console.error('转换图片失败:', error)
              return url // 如果转换失败，返回URL
            }
          })
        )

        return {
          code: 200,
          message: '生成成功',
          data: {
            images: base64Images.filter(img => img),
            task_id: taskId,
          },
        }
      } else {
        throw new Error(queryResponse.data?.error || queryResponse.message || '图片生成失败')
      }
    } catch (error: any) {
      console.error('生成图片失败:', error)
      throw error
    }
  }

  /**
   * 批量生成图片（按主题）
   */
  async batchGenerateByThemes(
    themes: Array<{ name: string; prompt: string; description: string }>
  ): Promise<Array<{ theme: string; images: string[]; prompt: string; description: string }>> {
    const results: Array<{ theme: string; images: string[]; prompt: string; description: string }> = []

    for (const theme of themes) {
      try {
        console.log(`正在生成主题 "${theme.name}" 的图片...`)
        const response = await this.generateImagesAndWait({
          prompt: theme.prompt,
          num_images: 2, // 每个主题生成2张图片供选择
        })

        if (response.data?.images) {
          results.push({
            theme: theme.name,
            images: response.data.images,
            prompt: theme.prompt,
            description: theme.description,
          })
        }
      } catch (error) {
        console.error(`主题 "${theme.name}" 生成失败:`, error)
        // 继续处理下一个主题
      }
    }

    return results
  }
}

export const imageGenerationService = new ImageGenerationService()

