import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

/**
 * 工作流节点数据
 */
export interface WorkflowNodeData {
  // 节点1：输入数据
  targetImages?: string[] // 目标风格图URLs
  srcImage?: string // 人物自拍图URL
  
  // 节点2：生成的提示词
  generatedPrompts?: string[] // 根据目标图生成的提示词列表
  
  // 节点3：转译后的结构化提示词
  structuredPrompts?: string[] // 转译后的结构化提示词列表
  finalPrompt?: string // 最终使用的prompt（可能是多个的合并）
  
  // 节点4：生成的封面图
  generatedAlbumCover?: string // 生成的albumCover URL
  
  // 节点5：生成的相册数据
  albumData?: {
    album_name: string
    album_description: string
    prompt_text: string
    style_description?: string
    theme_styles?: string[]
    activity_tags?: string[]
  }
}

/**
 * 生成提示词参数
 */
export interface GeneratePromptParams {
  image_url: string // 目标图URL
  src_image_url?: string // srcImage URL（可选，用于上下文）
}

/**
 * 转译提示词参数
 */
export interface TranslatePromptParams {
  prompt: string // 原始提示词
  src_image_url: string // srcImage URL
}

/**
 * 生成封面图参数
 */
export interface GenerateCoverParams {
  prompt: string // 最终提示词
  src_image_url: string // srcImage URL
}

/**
 * 生成相册数据参数
 */
export interface GenerateAlbumDataParams {
  target_images: string[] // 目标图URLs
  generated_prompts: string[] // 生成的提示词
  final_prompt: string // 最终使用的prompt
  generated_cover?: string // 生成的封面图URL
}

/**
 * 工作流服务
 */
class WorkflowService {
  /**
   * 节点2：根据目标图生成提示词（调用通义千问）
   */
  async generatePromptFromImage(params: GeneratePromptParams): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/generatePromptFromImage`,
        {
          image_url: params.image_url,
          src_image_url: params.src_image_url,
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.prompt
      } else {
        throw new Error(response.data?.message || '生成提示词失败')
      }
    } catch (error: unknown) {
      console.error('生成提示词失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成提示词失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 节点3：转译提示词为结构化提示词
   */
  async translatePromptToStructured(params: TranslatePromptParams): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/translatePromptToStructured`,
        {
          prompt: params.prompt,
          src_image_url: params.src_image_url,
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.structured_prompt
      } else {
        throw new Error(response.data?.message || '转译提示词失败')
      }
    } catch (error: unknown) {
      console.error('转译提示词失败:', error)
      const errorMessage = error instanceof Error ? error.message : '转译提示词失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 节点4：生成封面图（调用doubao img2img）
   */
  async generateAlbumCover(params: GenerateCoverParams): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/generateAlbumCover`,
        {
          prompt: params.prompt,
          src_image_url: params.src_image_url,
        },
        {
          timeout: 120000, // 2分钟超时（图片生成可能需要较长时间）
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.image_url
      } else {
        throw new Error(response.data?.message || '生成封面图失败')
      }
    } catch (error: unknown) {
      console.error('生成封面图失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成封面图失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 节点5：生成相册数据
   */
  async generateAlbumData(params: GenerateAlbumDataParams): Promise<{
    album_name: string
    album_description: string
    prompt_text: string
    style_description?: string
    theme_styles?: string[]
    activity_tags?: string[]
  }> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/generateAlbumDataFromWorkflow`,
        {
          target_images: params.target_images,
          generated_prompts: params.generated_prompts,
          final_prompt: params.final_prompt,
          generated_cover: params.generated_cover,
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data
      } else {
        throw new Error(response.data?.message || '生成相册数据失败')
      }
    } catch (error: unknown) {
      console.error('生成相册数据失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成相册数据失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }
}

export const workflowService = new WorkflowService()

