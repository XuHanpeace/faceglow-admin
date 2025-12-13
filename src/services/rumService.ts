import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

// 腾讯云RUM API配置
const RUM_PROJECT_ID = 1 // 需要根据实际情况配置，从aegis配置中获取

/**
 * RUM服务
 * 用于调用腾讯云前端性能监控API
 */
class RUMService {
  /**
   * 调用腾讯云RUM API
   */
  private async callRUMAPI(params: Record<string, any>): Promise<any> {
    try {
      // 注意：这里需要实现腾讯云API的签名逻辑
      // 为了简化，这里假设通过云函数来调用
      // 实际应该创建云函数来处理签名和API调用
      
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/callRUMAPI`,
        params,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data && response.data.code === 200) {
        return response.data.data
      } else {
        throw new Error(response.data?.message || '调用RUM API失败')
      }
    } catch (error: any) {
      console.error('调用RUM API失败:', error)
      throw new Error(error.response?.data?.message || error.message || '调用RUM API失败')
    }
  }

  /**
   * 获取自定义事件数据
   */
  async getEventData(params: {
    startTime: number
    endTime: number
    type: string
    name?: string
    extFirst?: string
    extSecond?: string
    extThird?: string
  }): Promise<any> {
    return this.callRUMAPI({
      Action: 'DescribeDataEventUrl',
      Version: '2021-06-22',
      ID: RUM_PROJECT_ID,
      StartTime: params.startTime,
      EndTime: params.endTime,
      Type: params.type,
      Name: params.name,
      ExtFirst: params.extFirst,
      ExtSecond: params.extSecond,
      ExtThird: params.extThird,
    })
  }

  /**
   * 获取页面PV数据
   */
  async getPagePV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckpv', // 获取PV趋势
      extFirst: 'fg_pv_', // 页面访问事件前缀
    })
  }

  /**
   * 获取页面UV数据
   */
  async getPageUV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckuv', // 获取UV趋势
      extFirst: 'fg_pv_', // 页面访问事件前缀
    })
  }

  /**
   * 获取APP PV数据
   */
  async getAppPV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckpv',
      extFirst: 'fg_action_', // APP行为事件
    })
  }

  /**
   * 获取APP UV数据
   */
  async getAppUV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckuv',
      extFirst: 'fg_action_',
    })
  }

  /**
   * 获取新用户注册数据（按天）
   */
  async getNewUserRegistration(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'day', // 14天数据
      name: 'fg_action_register', // 注册事件
    })
  }

  /**
   * 获取Album点击创作数据
   */
  async getAlbumCreationPV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckpv',
      name: 'fg_click_album_create', // Album点击创作事件
    })
  }

  /**
   * 获取Album点击创作UV
   */
  async getAlbumCreationUV(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'ckuv',
      name: 'fg_click_album_create',
    })
  }

  /**
   * 获取错误上报数据
   */
  async getErrorReports(startTime: number, endTime: number): Promise<any> {
    return this.getEventData({
      startTime,
      endTime,
      type: 'condition', // 条件列表
      extFirst: 'fg_error_', // 错误事件前缀
    })
  }
}

export const rumService = new RUMService()

