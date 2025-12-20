import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

/**
 * 任务类型枚举
 */
export enum TaskType {
  IMAGE_TO_IMAGE = 'image_to_image', // 图生图
  IMAGE_TO_VIDEO = 'image_to_video', // 图生视频
  VIDEO_EFFECT = 'video_effect', // 视频特效
  PORTRAIT_STYLE_REDRAW = 'portrait_style_redraw', // 人像风格重绘
  DOUBAO_IMAGE_TO_IMAGE = 'doubao_image_to_image', // 豆包图生图（同步返回）
}

/**
 * 豆包图生图参数
 */
export interface DoubaoImageToImageParams {
  /** 提示词文本 */
  prompt: string
  /** 
   * 图片URL数组（至少2张）
   * 
   * 重要：图片顺序与 prompt 中的"图1"、"图2"对应关系
   * - images[0] 对应 prompt 中的"图1"或"第一张图"
   * - images[1] 对应 prompt 中的"图2"或"第二张图"
   * - images[2] 对应 prompt 中的"图3"或"第三张图"
   * - 以此类推...
   * 
   * 在相册（Album）场景中的标准构建规则：
   * - images[0] = selectedSelfieUrl（用户选择的自拍图，人物来源图）
   * - images[1] = result_image（结果图/场景图，目标场景图）
   * 
   * 示例：
   * // 从相册数据和用户选择的自拍图构建
   * images: [selectedSelfieUrl, albumData.result_image]
   * prompt: "将图2中的人物替换为图1的人物"
   * 含义：将 images[1]（result_image，场景图）中的人物替换为 images[0]（selectedSelfieUrl，用户自拍图）中的人物
   * 
   * 注意：prompt 中提到的"图1"、"图2"等，是按照 images 数组的索引顺序（从1开始计数）
   */
  images: string[]
  /** 用户ID（价格>0时必填） */
  user_id?: string
  /** 模板价格（美美币），0表示免费 */
  price?: number
  /** 其他可选参数 */
  params?: {
    size?: string // 图片尺寸，默认'2K'
    watermark?: boolean // 是否添加水印，默认true
    sequential_image_generation?: string // 序列图像生成，默认'disabled'
  }
}

/**
 * 豆包图生图响应
 */
export interface DoubaoImageToImageResponse {
  success: boolean
  data?: {
    resultUrl?: string // 生成的图片URL
    responseData?: any
    message?: string
    currentBalance?: number
    requiredAmount?: number
    statusCode?: number
    details?: any
    requestUrl?: string
  } | null
  errCode?: string | null
  errorMsg?: string | null
}

/**
 * callBailian 服务
 */
class CallBailianService {
  /**
   * 调用豆包图生图接口（同步返回结果URL）
   */
  async callDoubaoImageToImage(params: DoubaoImageToImageParams): Promise<DoubaoImageToImageResponse> {
    try {
      console.log('🔄 调用豆包图生图:', params)

      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/callBailian`,
        {
          data: {
            task_type: TaskType.DOUBAO_IMAGE_TO_IMAGE,
            prompt: params.prompt,
            images: params.images,
            user_id: params.user_id,
            price: params.price || 0,
            params: params.params,
          },
        },
        {
          timeout: 120000, // 120秒超时（豆包图生图可能需要较长时间）
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('✅ 豆包图生图响应:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 豆包图生图调用失败:', error)

      // 处理余额不足错误
      if (error.response?.data?.errCode === 'INSUFFICIENT_BALANCE') {
        return {
          success: false,
          data: error.response.data.data || null,
          errCode: 'INSUFFICIENT_BALANCE',
          errorMsg: error.response.data.errorMsg || '余额不足',
        }
      }

      return {
        success: false,
        data: error.response?.data?.data || null,
        errCode: error.response?.data?.errCode || 'API_ERROR',
        errorMsg: error.response?.data?.errorMsg || error.message || '调用豆包图生图失败',
      }
    }
  }
}

export const callBailianService = new CallBailianService()
