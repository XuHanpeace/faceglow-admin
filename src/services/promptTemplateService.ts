import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'
import type { PromptTemplateRecord, RenderedPrompt } from '../types/promptTemplate'

/**
 * Prompt模板服务
 */
class PromptTemplateService {
  /**
   * 获取所有Prompt模板
   */
  async getPromptTemplates(params?: {
    template_type?: string
    is_active?: boolean
  }): Promise<{ code: number; message: string; data: PromptTemplateRecord[] }> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/getPromptTemplates`,
        params || {},
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data
      } else {
        throw new Error(response.data?.message || '获取Prompt模板失败')
      }
    } catch (error: unknown) {
      console.error('获取Prompt模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '获取Prompt模板失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 创建Prompt模板
   */
  async createPromptTemplate(
    template: Omit<PromptTemplateRecord, 'template_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/createPromptTemplate`,
        template,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.template_id
      } else {
        throw new Error(response.data?.message || '创建Prompt模板失败')
      }
    } catch (error: unknown) {
      console.error('创建Prompt模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '创建Prompt模板失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 更新Prompt模板
   */
  async updatePromptTemplate(
    templateId: string,
    updates: Partial<PromptTemplateRecord>
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/updatePromptTemplate`,
        {
          template_id: templateId,
          updates,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return
      } else {
        throw new Error(response.data?.message || '更新Prompt模板失败')
      }
    } catch (error: unknown) {
      console.error('更新Prompt模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '更新Prompt模板失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 删除Prompt模板
   */
  async deletePromptTemplate(templateId: string): Promise<void> {
    try {
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/deletePromptTemplate`,
        {
          template_id: templateId,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return
      } else {
        throw new Error(response.data?.message || '删除Prompt模板失败')
      }
    } catch (error: unknown) {
      console.error('删除Prompt模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除Prompt模板失败'
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        errorMessage
      )
    }
  }

  /**
   * 渲染Prompt模板（替换变量）
   */
  renderPromptTemplate(
    template: PromptTemplateRecord,
    variables: Record<string, string> = {}
  ): RenderedPrompt {
    let promptText = template.prompt_structure.base_template

    // 替换变量
    if (template.prompt_structure.variables) {
      for (const [key, varDef] of Object.entries(template.prompt_structure.variables)) {
        const value = variables[key] || varDef.default_value || ''
        promptText = promptText.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
      }
    }

    // 添加风格增强词
    if (template.prompt_structure.style_enhancements && template.prompt_structure.style_enhancements.length > 0) {
      promptText += ', ' + template.prompt_structure.style_enhancements.join(', ')
    }

    // 添加质量增强词
    if (template.prompt_structure.quality_enhancements && template.prompt_structure.quality_enhancements.length > 0) {
      promptText += ', ' + template.prompt_structure.quality_enhancements.join(', ')
    }

    // 生成风格描述（简化版，从prompt中提取）
    const styleDescription = this.extractStyleDescription(promptText)

    // 生成负面提示词
    let negativePrompt = ''
    if (template.prompt_structure.negative_prompt_template) {
      negativePrompt = template.prompt_structure.negative_prompt_template
      // 替换负面提示词中的变量
      if (template.prompt_structure.variables) {
        for (const [key, varDef] of Object.entries(template.prompt_structure.variables)) {
          const value = variables[key] || varDef.default_value || ''
          negativePrompt = negativePrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
        }
      }
    }

    return {
      prompt_text: promptText.trim(),
      style_description: styleDescription,
      negative_prompt: negativePrompt || undefined,
    }
  }

  /**
   * 从prompt中提取风格描述（简化版）
   */
  private extractStyleDescription(prompt: string): string {
    // 简单的提取逻辑：取前100个字符作为风格描述
    // 实际可以更智能地提取关键词
    return prompt.substring(0, 100).trim()
  }
}

export const promptTemplateService = new PromptTemplateService()

