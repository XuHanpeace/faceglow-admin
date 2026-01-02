import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

/**
 * AI生成的相册数据
 */
export interface AIGeneratedAlbumData {
  album_name: string
  album_description: string
  prompt_text: string
  style_description?: string
  theme_styles?: string[]
  activity_tags?: string[]
  suggested_level?: string
  suggested_price?: number
}

/**
 * 生成相册数据的请求参数
 */
export interface GenerateAlbumDataParams {
  style_image_url: string // 目标风格图URL
  src_image_url?: string // 固化的srcImage（可选）
  function_type?: string // 功能类型（可选，用于优化生成）
  prompt_template_id?: string // Prompt模板ID（可选）
}

/**
 * 相册AI生成服务
 */
class AlbumAIService {
  /**
   * 根据风格图生成相册数据（标题、描述、prompt等）
   */
  async generateAlbumData(params: GenerateAlbumDataParams): Promise<AIGeneratedAlbumData> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/generateAlbumData`,
        {
          style_image_url: params.style_image_url,
          src_image_url: params.src_image_url,
          function_type: params.function_type,
          prompt_template_id: params.prompt_template_id,
        },
        {
          timeout: 60000, // 60秒超时（AI生成可能需要较长时间）
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data
      } else {
        throw new Error(response.data?.message || 'AI生成相册数据失败')
      }
    } catch (error: unknown) {
      console.error('AI生成相册数据失败:', error)
      const errorMessage = error instanceof Error ? error.message : 'AI生成相册数据失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 预览AI生成的数据（不保存）
   */
  async previewAlbumData(params: GenerateAlbumDataParams): Promise<AIGeneratedAlbumData> {
    return this.generateAlbumData(params)
  }
}

export const albumAIService = new AlbumAIService()

