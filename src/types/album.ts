/**
 * 主题风格枚举
 */
export enum ThemeStyle {
  WINTER = 'winter',
  CHRISTMAS = 'christmas',
  COUPLES = 'couples',
  PLAYFUL = 'playful',
  POLAROID = 'polaroid',
  ID_PHOTO = 'id_photo',
  PURE_DESIRE = 'pure_desire',
  ATMOSPHERE = 'atmosphere',
}

/**
 * 功能类型枚举
 */
export enum FunctionType {
  PORTRAIT = 'portrait',
  GROUP_PHOTO = 'group_photo',
  IMAGE_TO_IMAGE = 'image_to_image'
}

/**
 * 活动标签枚举
 */
export enum ActivityTag {
  NEW = 'new',
  DISCOUNT = 'discount',
  FREE = 'free',
}

/**
 * 相册等级
 */
export enum AlbumLevel {
  FREE = '0',
  PREMIUM = '1',
  VIP = '2',
}

/**
 * Album 数据库记录
 */
export interface AlbumRecord {
  album_id: string
  album_name: string
  album_description: string
  album_image: string
  theme_styles: string[]
  function_type: string
  activity_tags: string[]
  task_execution_type: string
  level: string
  price: number
  original_price?: number
  activity_tag_type?: 'discount' | 'free' | 'premium' | 'member' | 'new'
  activity_tag_text?: string
  template_list?: any[]
  src_image?: string
  result_image?: string
  prompt_text?: string
  style_description?: string
  likes: number
  sort_weight: number
  preview_video_url?: string
  allow_custom_prompt?: boolean
  custom_prompt_placeholder?: string
  audio_url?: string
  video_effect_template?: string
  // 人像风格重绘相关字段
  style_index?: number // 风格索引（0-9为预设风格，-1为自定义风格）
  style_ref_url?: string // 风格参考图URL（当style_index=-1时使用）
  // 豆包图生图相关字段
  exclude_result_image?: boolean // 是否排除 result_image（默认 false，即包含 result_image，保持历史版本兼容）
  // 发布状态
  published?: boolean
  created_at?: string
  updated_at?: string
}

