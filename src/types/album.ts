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
  IMAGE_TO_IMAGE = 'image_to_image',
  IMAGE_TO_VIDEO = 'image_to_video',
  VIDEO_EFFECT = 'video_effect',
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
  // 发布状态
  published?: boolean
  created_at?: string
  updated_at?: string
}

