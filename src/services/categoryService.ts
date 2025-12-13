import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'
import type { CategoryConfigRecord } from '../types/category'

// 云函数基础URL
const CLOUD_FUNCTION_BASE_URL = CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL

export interface CategoryConfigResponse {
  code: number
  message: string
  data: CategoryConfigRecord[]
}

/**
 * Category服务
 */
class CategoryService {
  /**
   * 获取Category配置列表（调用云函数）
   */
  async getCategoryConfig(): Promise<CategoryConfigResponse> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/getCategoryConfig`,
        {},
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
        throw new Error(response.data?.message || '获取Category配置失败')
      }
    } catch (error: any) {
      console.error('获取Category配置失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取Category配置失败')
    }
  }

  /**
   * 创建Category记录（调用云函数）
   */
  async createCategory(category: Omit<CategoryConfigRecord, 'category_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/createCategoryConfig`,
        category,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.category_id
      } else {
        throw new Error(response.data?.message || '创建Category配置失败')
      }
    } catch (error: any) {
      console.error('创建Category失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建Category失败')
    }
  }

  /**
   * 更新Category记录（调用云函数）
   */
  async updateCategory(categoryId: string, updates: Partial<CategoryConfigRecord>): Promise<void> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/updateCategoryConfig`,
        {
          category_id: categoryId,
          updates
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
        throw new Error(response.data?.message || '更新Category配置失败')
      }
    } catch (error: any) {
      console.error('更新Category配置失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新Category配置失败')
    }
  }

  /**
   * 生成Category ID
   */
  private generateCategoryId(categoryType: string, categoryCode: string): string {
    const prefixMap: Record<string, string> = {
      function_type: 'ft_',
      theme_style: 'ts_',
      activity_tag: 'at_',
    }
    const prefix = prefixMap[categoryType] || ''
    return `${prefix}${categoryCode}`
  }
}

export const categoryService = new CategoryService()

