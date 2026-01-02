/**
 * Prompt模板记录
 */
export interface PromptTemplateRecord {
  template_id: string
  template_name: string // 模板名称
  template_type: 'doubao_img2img' | 'image_to_image' | 'image_to_video' | 'portrait_style_redraw' | 'general' // 模板类型
  prompt_structure: PromptStructure // 结构化的prompt结构
  description?: string // 模板描述
  is_active: boolean // 是否启用
  usage_count?: number // 使用次数
  created_at?: string
  updated_at?: string
}

/**
 * 结构化的Prompt结构
 * 支持变量替换，例如：{style}, {subject}, {quality}等
 */
export interface PromptStructure {
  // 基础prompt模板（支持变量）
  base_template: string
  
  // 变量定义
  variables?: {
    [key: string]: {
      name: string // 变量名称（中文）
      description: string // 变量描述
      default_value?: string // 默认值
      options?: string[] // 可选值列表（如果有）
      required: boolean // 是否必填
    }
  }
  
  // 风格增强词（可选）
  style_enhancements?: string[]
  
  // 质量增强词（可选）
  quality_enhancements?: string[]
  
  // 负面提示词模板（可选）
  negative_prompt_template?: string
}

/**
 * 渲染后的Prompt（变量已替换）
 */
export interface RenderedPrompt {
  prompt_text: string
  style_description?: string
  negative_prompt?: string
}

