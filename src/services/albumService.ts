import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'
import type { AlbumRecord } from '../types/album'

// 云函数基础URL
const CLOUD_FUNCTION_BASE_URL = CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL

export interface GetAlbumListParams {
  page?: number
  page_size?: number
  function_types?: string[]
  theme_styles?: string[]
  activity_tags?: string[]
  sort_by?: 'default' | 'likes' | 'created_at'
  include_unpublished?: boolean  // 是否包含未发布的数据，默认 false（只返回已发布的）
}

export interface AlbumListResponse {
  code: number
  message: string
  data: {
    albums: AlbumRecord[]
    total: number
    has_more: boolean
  }
}

/**
 * Album服务
 */
class AlbumService {
  /**
   * 获取相册列表（调用云函数）
   */
  async getAlbumList(params: GetAlbumListParams = {}): Promise<AlbumListResponse> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/getAlbumList`,
        {
          page: params.page || 1,
          page_size: params.page_size || 20,
          function_types: params.function_types,
          theme_styles: params.theme_styles,
          activity_tags: params.activity_tags,
          sort_by: params.sort_by || 'default',
          include_unpublished: params.include_unpublished || false,
        },
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
        throw new Error(response.data?.message || '获取相册列表失败')
      }
    } catch (error: any) {
      console.error('获取相册列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取相册列表失败')
    }
  }

  /**
   * 更新Album记录（通过云函数）
   */
  async updateAlbum(albumId: string, updates: Partial<AlbumRecord>): Promise<void> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/updateAlbum`,
        {
          album_id: albumId,
          updates: updates,
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
        throw new Error(response.data?.message || '更新Album失败')
      }
    } catch (error: any) {
      console.error('更新Album失败:', error)
      throw new Error(error.response?.data?.message || error.message || '更新Album失败')
    }
  }

  /**
   * 切换Album发布状态
   */
  async togglePublishStatus(albumId: string, published: boolean): Promise<void> {
    await this.updateAlbum(albumId, { published })
  }

  /**
   * 更新Album的tag
   */
  async updateAlbumTags(
    albumId: string,
    tags: {
      theme_styles?: string[]
      activity_tags?: string[]
    }
  ): Promise<void> {
    const updates: any = {}
    if (tags.theme_styles !== undefined) {
      updates.theme_styles = tags.theme_styles
    }
    if (tags.activity_tags !== undefined) {
      updates.activity_tags = tags.activity_tags
    }
    await this.updateAlbum(albumId, updates)
  }

  /**
   * 删除Album（通过云函数）
   */
  async deleteAlbum(albumId: string): Promise<void> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/deleteAlbum`,
        {
          album_id: albumId,
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
        throw new Error(response.data?.message || '删除Album失败')
      }
    } catch (error: any) {
      console.error('删除Album失败:', error)
      throw new Error(error.response?.data?.message || error.message || '删除Album失败')
    }
  }

  /**
   * 创建Album记录（通过云函数）
   */
  async createAlbum(album: Omit<AlbumRecord, 'album_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/createAlbum`,
        album,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data.album_id
      } else {
        throw new Error(response.data?.message || '创建Album失败')
      }
    } catch (error: any) {
      console.error('创建Album失败:', error)
      throw new Error(error.response?.data?.message || error.message || '创建Album失败')
    }
  }
}

export const albumService = new AlbumService()

