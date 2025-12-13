import axios from 'axios'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

/**
 * COS上传参数
 */
export interface COSUploadParams {
  file: File | Blob // 文件对象
  fileName: string // 文件名
  folder?: string // 文件夹路径，默认为 'albums'
}

/**
 * COS上传响应
 */
export interface COSUploadResponse {
  success: boolean
  url?: string
  fileKey?: string
  error?: string
}

/**
 * COS上传服务
 * 通过云函数上传到COS，保护密钥
 */
class COSUploadService {
  /**
   * 上传文件到COS
   * 使用 FormData 直接上传文件，避免 base64 编码导致请求体过大
   */
  async uploadFile(params: COSUploadParams): Promise<COSUploadResponse> {
    try {
      const file = params.file
      if (!(file instanceof File || file instanceof Blob)) {
        throw new Error('不支持的文件类型，请提供File或Blob对象')
      }

      // 使用 FormData 上传文件
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', params.fileName)
      formData.append('folder', params.folder || 'albums')

      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/uploadToCos`,
        formData,
        {
          timeout: 60000, // 60秒超时
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // 处理响应数据
      let responseData = response.data
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          responseData = response.data
        }
      }

      if (responseData && responseData.code === 200) {
        return {
          success: true,
          url: responseData.data.url,
          fileKey: responseData.data.fileKey,
        }
      } else {
        throw new Error(responseData?.message || '上传失败')
      }
    } catch (error: any) {
      console.error('COS上传失败:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '上传失败',
      }
    }
  }

  /**
   * 将base64图片转换为Blob并上传
   */
  async uploadBase64Image(
    base64Image: string,
    fileName: string,
    folder?: string
  ): Promise<COSUploadResponse> {
    try {
      // 处理base64字符串（可能包含data:image/png;base64,前缀）
      let base64Data = base64Image
      if (base64Image.includes(',')) {
        base64Data = base64Image.split(',')[1]
      } else if (!base64Image.startsWith('data:')) {
        // 如果只是纯base64，添加data URL前缀
        base64Data = base64Image
      }

      // 直接发送base64字符串到云函数
      const response = await axios.post(
        `${CLOUDBASE_CONFIG.FUNCTION_API.BASE_URL}/uploadToCos`,
        {
          file: base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`,
          fileName,
          folder: folder || 'albums',
        },
        {
          timeout: 60000, // 60秒超时
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // 处理响应数据（可能是直接返回的对象，也可能是包装在 body 中的字符串）
      let responseData = response.data
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData)
        } catch (e) {
          // 如果解析失败，尝试解析 response.data
          responseData = response.data
        }
      }

      if (responseData && responseData.code === 200) {
        return {
          success: true,
          url: responseData.data.url,
          fileKey: responseData.data.fileKey,
        }
      } else {
        throw new Error(responseData?.message || '上传失败')
      }
    } catch (error: any) {
      console.error('Base64图片上传失败:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Base64图片上传失败',
      }
    }
  }

  /**
   * 批量上传图片
   */
  async batchUploadImages(
    images: Array<{ base64: string; fileName: string }>,
    folder?: string
  ): Promise<Array<{ fileName: string; url?: string; error?: string }>> {
    const results: Array<{ fileName: string; url?: string; error?: string }> = []

    for (const image of images) {
      const result = await this.uploadBase64Image(image.base64, image.fileName, folder)
      results.push({
        fileName: image.fileName,
        url: result.url,
        error: result.error,
      })
    }

    return results
  }
}

export const cosUploadService = new COSUploadService()

