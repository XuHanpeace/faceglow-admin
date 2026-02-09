import { useState, useEffect } from 'react'
import { Table, Button, Space, message, Tag, Switch, Modal, Select, Input, InputNumber, Upload, Image, Row, Col, Divider, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import { EditOutlined, UploadOutlined } from '@ant-design/icons'
import { albumService } from '../services/albumService'
import { categoryService } from '../services/categoryService'
import { cosUploadService } from '../services/cosUpload'
import type { AlbumRecord } from '../types/album'
import type { CategoryConfigRecord } from '../types/category'
import { FunctionType } from '../types/album'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useNavigate, useLocation } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

export default function AlbumListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('albums')

  // 处理导航
  const handleNavigate = (pageId: string) => {
    setActivePage(pageId)
    navigate(`/${pageId}`)
  }

  // 根据当前路由更新 activePage
  useEffect(() => {
    const currentPath = location.pathname.replace('/', '') || 'dashboard'
    setActivePage(currentPath)
  }, [location.pathname])
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryConfigRecord[]>([])
  const [editingAlbum, setEditingAlbum] = useState<AlbumRecord | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [uploadingSrcImage, setUploadingSrcImage] = useState(false)
  const [uploadingResultImage, setUploadingResultImage] = useState(false)
  const [srcImageFile, setSrcImageFile] = useState<UploadFile | null>(null)
  const [srcImagePreview, setSrcImagePreview] = useState<string>('')
  const [srcImage1File, setSrcImage1File] = useState<UploadFile | null>(null)
  const [srcImage1Preview, setSrcImage1Preview] = useState<string>('')
  const [srcImage2File, setSrcImage2File] = useState<UploadFile | null>(null)
  const [srcImage2Preview, setSrcImage2Preview] = useState<string>('')
  const [uploadingSrcImage1, setUploadingSrcImage1] = useState(false)
  const [uploadingSrcImage2, setUploadingSrcImage2] = useState(false)
  const [resultImageFile, setResultImageFile] = useState<UploadFile | null>(null)
  const [resultImagePreview, setResultImagePreview] = useState<string>('')
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null)
  const [editingWeightValue, setEditingWeightValue] = useState<number>(0)
  const [previewImage, setPreviewImage] = useState<{ visible: boolean; url: string }>({ visible: false, url: '' })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 获取Category配置
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoryConfig()
      setCategories(response.data || [])
    } catch (error: any) {
      console.error('获取Category配置失败:', error)
    }
  }

  // 获取相册列表（包含未发布的数据，用于管理操作）
  const fetchAlbums = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true)
      const response = await albumService.getAlbumList({ 
        page, 
        page_size: pageSize,
        include_unpublished: true  // 获取所有数据，包括未发布的，以便进行上下线操作
      })
      setAlbums(response.data.albums || [])
      setPagination({
        current: page,
        pageSize,
        total: response.data.total || 0,
      })
    } catch (error: any) {
      console.error('获取相册列表失败:', error)
      message.error(error.message || '获取相册列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchAlbums()
  }, [])

  // 切换发布状态
  const handleTogglePublish = async (albumId: string, published: boolean) => {
    try {
      await albumService.togglePublishStatus(albumId, published)
      message.success(published ? '已发布' : '已下线')
      fetchAlbums(pagination.current, pagination.pageSize)
    } catch (error: any) {
      console.error('切换发布状态失败:', error)
      message.error(error.message || '操作失败')
    }
  }

  // 更新权重
  const handleUpdateSortWeight = async (albumId: string, sortWeight: number) => {
    try {
      await albumService.updateAlbum(albumId, { sort_weight: sortWeight })
      message.success('权重更新成功')
      fetchAlbums(pagination.current, pagination.pageSize)
    } catch (error: any) {
      console.error('更新权重失败:', error)
      message.error(error.message || '更新权重失败')
    }
  }

  // 打开编辑Modal
  const handleEdit = (album: AlbumRecord) => {
    const nextAlbum: AlbumRecord = { ...album }
    // 图生视频：默认启用自定义提示词
    if (nextAlbum.task_execution_type === 'async_image_to_video' && nextAlbum.enable_custom_prompt === undefined) {
      nextAlbum.enable_custom_prompt = true
    }
    // 豆包图生图：如果 enable_custom_prompt 是 undefined 或 null，默认设置为 true（因为 Switch 的 checked 逻辑是 !== false）
    if (nextAlbum.task_execution_type === 'async_doubao_image_to_image' && (nextAlbum.enable_custom_prompt === undefined || nextAlbum.enable_custom_prompt === null)) {
      nextAlbum.enable_custom_prompt = true
    }
    setEditingAlbum(nextAlbum)
    setSrcImageFile(null)
    setSrcImagePreview('')
    setSrcImage1File(null)
    setSrcImage1Preview('')
    setSrcImage2File(null)
    setSrcImage2Preview('')
    setResultImageFile(null)
    setResultImagePreview('')
    setEditModalVisible(true)
  }

  // 处理原始图上传
  const handleSrcImageChange = async (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setSrcImageFile(null)
      setSrcImagePreview('')
      if (editingAlbum) {
        setEditingAlbum({ ...editingAlbum, src_image: '' })
      }
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setSrcImageFile(file as UploadFile)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setSrcImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)

      // 上传图片
      try {
        setUploadingSrcImage(true)
        const fileName = `album_src_${Date.now()}.${fileObj.name?.split('.').pop() || 'png'}`
        const result = await cosUploadService.uploadFile({
          file: fileObj,
          fileName,
          folder: 'albums',
        })

        if (result.success && result.url && editingAlbum) {
          setEditingAlbum({ ...editingAlbum, src_image: result.url })
          message.success('原始图上传成功')
        } else {
          message.error(result.error || '上传失败')
        }
      } catch (error: any) {
        console.error('上传原始图失败:', error)
        message.error(error.message || '上传失败')
      } finally {
        setUploadingSrcImage(false)
      }
    }
  }

  // 处理多人合拍原始图1上传（src_images[0]）
  const handleSrcImage1Change = async (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setSrcImage1File(null)
      setSrcImage1Preview('')
      if (editingAlbum) {
        const srcImages = editingAlbum.src_images || []
        srcImages[0] = ''
        setEditingAlbum({ ...editingAlbum, src_images: srcImages })
      }
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setSrcImage1File(file as UploadFile)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setSrcImage1Preview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)

      // 上传图片
      try {
        setUploadingSrcImage1(true)
        const fileName = `album_src1_${Date.now()}.${fileObj.name?.split('.').pop() || 'png'}`
        const result = await cosUploadService.uploadFile({
          file: fileObj,
          fileName,
          folder: 'albums',
        })

        if (result.success && result.url && editingAlbum) {
          const srcImages = editingAlbum.src_images || []
          srcImages[0] = result.url
          setEditingAlbum({ ...editingAlbum, src_images: srcImages })
          message.success('原始图1上传成功')
        } else {
          message.error(result.error || '上传失败')
        }
      } catch (error: any) {
        console.error('上传原始图1失败:', error)
        message.error(error.message || '上传失败')
      } finally {
        setUploadingSrcImage1(false)
      }
    }
  }

  // 处理多人合拍原始图2上传（src_images[1]）
  const handleSrcImage2Change = async (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setSrcImage2File(null)
      setSrcImage2Preview('')
      if (editingAlbum) {
        const srcImages = editingAlbum.src_images || []
        srcImages[1] = ''
        setEditingAlbum({ ...editingAlbum, src_images: srcImages })
      }
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setSrcImage2File(file as UploadFile)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setSrcImage2Preview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)

      // 上传图片
      try {
        setUploadingSrcImage2(true)
        const fileName = `album_src2_${Date.now()}.${fileObj.name?.split('.').pop() || 'png'}`
        const result = await cosUploadService.uploadFile({
          file: fileObj,
          fileName,
          folder: 'albums',
        })

        if (result.success && result.url && editingAlbum) {
          const srcImages = editingAlbum.src_images || []
          srcImages[1] = result.url
          setEditingAlbum({ ...editingAlbum, src_images: srcImages })
          message.success('原始图2上传成功')
        } else {
          message.error(result.error || '上传失败')
        }
      } catch (error: any) {
        console.error('上传原始图2失败:', error)
        message.error(error.message || '上传失败')
      } finally {
        setUploadingSrcImage2(false)
      }
    }
  }

  // 处理结果图上传
  const handleResultImageChange = async (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setResultImageFile(null)
      setResultImagePreview('')
      if (editingAlbum) {
        setEditingAlbum({ ...editingAlbum, result_image: '' })
      }
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setResultImageFile(file as UploadFile)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setResultImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)

      // 上传图片
      try {
        setUploadingResultImage(true)
        const fileName = `album_result_${Date.now()}.${fileObj.name?.split('.').pop() || 'png'}`
        const result = await cosUploadService.uploadFile({
          file: fileObj,
          fileName,
          folder: 'albums',
        })

        if (result.success && result.url && editingAlbum) {
          setEditingAlbum({ ...editingAlbum, result_image: result.url })
          message.success('结果图上传成功')
        } else {
          message.error(result.error || '上传失败')
        }
      } catch (error: any) {
        console.error('上传结果图失败:', error)
        message.error(error.message || '上传失败')
      } finally {
        setUploadingResultImage(false)
      }
    }
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingAlbum) return

    try {
      // 构建更新数据
      const updates: Partial<AlbumRecord> = {
        album_name: editingAlbum.album_name,
        function_type: editingAlbum.function_type,
        task_execution_type: editingAlbum.task_execution_type,
        theme_styles: editingAlbum.theme_styles,
        activity_tags: editingAlbum.activity_tags,
        sort_weight: editingAlbum.sort_weight,
      }

      // 根据 task_execution_type 更新相关字段
      const taskType = editingAlbum.task_execution_type

      // 同步任务（sync_portrait, sync_group_photo）- 不需要特殊字段，使用 template_list
      
      // 异步任务 - 图生图
      if (taskType === 'async_image_to_image') {
        if (editingAlbum.src_image) {
          updates.src_image = editingAlbum.src_image
        }
        if (editingAlbum.result_image) {
          updates.result_image = editingAlbum.result_image
        }
        if (editingAlbum.prompt_text !== undefined) {
          updates.prompt_text = editingAlbum.prompt_text
        }
        if (editingAlbum.style_description !== undefined) {
          updates.style_description = editingAlbum.style_description
        }
      }

      // 异步任务 - 图生视频
      if (taskType === 'async_image_to_video') {
        if (editingAlbum.src_image) {
          updates.src_image = editingAlbum.src_image
        }
        if (editingAlbum.preview_video_url) {
          updates.preview_video_url = editingAlbum.preview_video_url
        }
        if (editingAlbum.prompt_text !== undefined) {
          updates.prompt_text = editingAlbum.prompt_text
        }
        if (editingAlbum.enable_custom_prompt !== undefined) {
          updates.enable_custom_prompt = editingAlbum.enable_custom_prompt
        }
        if (editingAlbum.custom_prompt !== undefined) {
          updates.custom_prompt = editingAlbum.custom_prompt
        }
        if (editingAlbum.custom_prompt_tips !== undefined) {
          updates.custom_prompt_tips = editingAlbum.custom_prompt_tips
        }
      }

      // 异步任务 - 视频特效
      if (taskType === 'async_video_effect') {
        if (editingAlbum.video_effect_template !== undefined) {
          updates.video_effect_template = editingAlbum.video_effect_template
        }
        if (editingAlbum.src_image) {
          updates.src_image = editingAlbum.src_image
        }
        if (editingAlbum.preview_video_url) {
          updates.preview_video_url = editingAlbum.preview_video_url
        }
      }

      // 异步任务 - 人像风格重绘
      if (taskType === 'async_portrait_style_redraw') {
        if (editingAlbum.style_index !== undefined) {
          updates.style_index = editingAlbum.style_index
        }
        if (editingAlbum.style_ref_url !== undefined) {
          updates.style_ref_url = editingAlbum.style_ref_url
        }
        if (editingAlbum.src_image) {
          updates.src_image = editingAlbum.src_image
        }
        if (editingAlbum.result_image) {
          updates.result_image = editingAlbum.result_image
        }
        if (editingAlbum.prompt_text !== undefined) {
          updates.prompt_text = editingAlbum.prompt_text
        }
      }

      // 异步任务 - 豆包图生图
      if (taskType === 'async_doubao_image_to_image') {
        if (editingAlbum.src_images !== undefined) {
          updates.src_images = editingAlbum.src_images
          // 自动将 src_images[0] 填充到 src_image（向后兼容）
          if (editingAlbum.src_images && editingAlbum.src_images.length > 0 && editingAlbum.src_images[0]) {
            updates.src_image = editingAlbum.src_images[0]
          }
        }
        if (editingAlbum.result_image) {
          updates.result_image = editingAlbum.result_image
        }
        if (editingAlbum.prompt_text !== undefined) {
          updates.prompt_text = editingAlbum.prompt_text
        }
        if (editingAlbum.style_description !== undefined) {
          updates.style_description = editingAlbum.style_description
        }
        // enable_custom_prompt 必须明确保存，即使是 false 也要保存
        if (editingAlbum.enable_custom_prompt !== undefined && editingAlbum.enable_custom_prompt !== null) {
          updates.enable_custom_prompt = editingAlbum.enable_custom_prompt
        } else {
          // 如果未设置，根据 Switch 的默认行为（!== false 为 true），保存为 true
          updates.enable_custom_prompt = true
        }
        if (editingAlbum.custom_prompt !== undefined) {
          updates.custom_prompt = editingAlbum.custom_prompt
        }
        if (editingAlbum.custom_prompt_tips !== undefined) {
          updates.custom_prompt_tips = editingAlbum.custom_prompt_tips
        }
        if (editingAlbum.exclude_result_image !== undefined) {
          updates.exclude_result_image = editingAlbum.exclude_result_image
        }
        if (editingAlbum.is_multi_person !== undefined) {
          updates.is_multi_person = editingAlbum.is_multi_person
        }
      }

      // 异步任务 - 混元生图
      if (taskType === 'async_hunyuan_image') {
        if (editingAlbum.src_images !== undefined) {
          updates.src_images = editingAlbum.src_images
          if (editingAlbum.src_images && editingAlbum.src_images.length > 0 && editingAlbum.src_images[0]) {
            updates.src_image = editingAlbum.src_images[0]
          }
        }
        if (editingAlbum.src_image) {
          updates.src_image = editingAlbum.src_image
        }
        if (editingAlbum.result_image) {
          updates.result_image = editingAlbum.result_image
        }
        if (editingAlbum.prompt_text !== undefined) {
          updates.prompt_text = editingAlbum.prompt_text
        }
        if (editingAlbum.hunyuan_resolution !== undefined) {
          updates.hunyuan_resolution = editingAlbum.hunyuan_resolution
        }
        if (editingAlbum.hunyuan_revise !== undefined) {
          updates.hunyuan_revise = editingAlbum.hunyuan_revise
        }
        if (editingAlbum.is_multi_person !== undefined) {
          updates.is_multi_person = editingAlbum.is_multi_person
        }
        // enable_custom_prompt 必须明确保存
        if (editingAlbum.enable_custom_prompt !== undefined && editingAlbum.enable_custom_prompt !== null) {
          updates.enable_custom_prompt = editingAlbum.enable_custom_prompt
        } else {
          updates.enable_custom_prompt = true
        }
        if (editingAlbum.custom_prompt !== undefined) {
          updates.custom_prompt = editingAlbum.custom_prompt
        }
        if (editingAlbum.custom_prompt_tips !== undefined) {
          updates.custom_prompt_tips = editingAlbum.custom_prompt_tips
        }
        // 任务级参数（客户端透传云函数）
        updates.task_params = {
          resolution: editingAlbum.hunyuan_resolution || '720:1280',
          revise: editingAlbum.hunyuan_revise !== false ? 1 : 0,
        }
      }

      await albumService.updateAlbum(editingAlbum.album_id, updates)
      message.success('保存成功')
      setEditModalVisible(false)
      setEditingAlbum(null)
      setSrcImageFile(null)
      setSrcImagePreview('')
      setResultImageFile(null)
      setResultImagePreview('')
      fetchAlbums(pagination.current, pagination.pageSize)
    } catch (error: any) {
      console.error('保存失败:', error)
      message.error(error.message || '保存失败')
    }
  }

  // 获取Category标签
  const getCategoryLabel = (code: string, type: string): string => {
    const category = categories.find(
      c => c.category_code === code && c.category_type === type
    )
    return category?.category_label_zh || category?.category_label || code
  }

  // 获取任务执行类型显示文本
  const getTaskExecutionTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'sync_portrait': '同步执行 - 个人写真换脸',
      'sync_group_photo': '同步执行 - 多人合拍换脸',
      'async_image_to_image': '异步执行 - 图生图',
      'async_image_to_video': '异步执行 - 图生视频',
      'async_video_effect': '异步执行 - 视频特效',
      'async_portrait_style_redraw': '异步执行 - 人像风格重绘',
      'async_doubao_image_to_image': '异步执行 - 豆包图生图',
      'async_hunyuan_image': '异步执行 - 混元生图',
      // 向后兼容
      'sync': '同步执行（sync）',
      'async': '异步执行（async）',
    }
    return typeMap[type] || type || '未知'
  }

  // 任务执行类型选项
  const taskExecutionTypeOptions = [
    { value: 'async_image_to_image', label: '异步执行 - 图生图（调用 callBailian）' },
    { value: 'async_image_to_video', label: '异步执行 - 图生视频（调用 callBailian）' },
    { value: 'async_video_effect', label: '异步执行 - 视频特效（调用 callBailian）' },
    { value: 'async_portrait_style_redraw', label: '异步执行 - 人像风格重绘（调用 callBailian）' },
    { value: 'async_doubao_image_to_image', label: '异步执行 - 豆包图生图（调用 callBailian）' },
    { value: 'async_hunyuan_image', label: '异步执行 - 混元生图（调用 callBailian）' },
  ]

  // 获取功能类型选项
  const functionTypeOptions = categories
    .filter(c => c.category_type === 'function_type' && c.is_active)
    .map(c => ({ value: c.category_code, label: c.category_label_zh || c.category_label }))

  // 获取主题风格选项
  const themeStyleOptions = categories
    .filter(c => c.category_type === 'theme_style' && c.is_active)
    .map(c => ({ value: c.category_code, label: c.category_label_zh || c.category_label }))

  // 获取活动标签选项
  const activityTagOptions = categories
    .filter(c => c.category_type === 'activity_tag' && c.is_active)
    .map(c => ({ value: c.category_code, label: c.category_label_zh || c.category_label }))

  const columns: ColumnsType<AlbumRecord> = [
    {
      title: '封面',
      dataIndex: 'album_image',
      key: 'album_image',
      width: 100,
      render: (url: string, record: AlbumRecord) => {
        if (!url) {
          return (
            <div
              style={{
                width: 60,
                height: 60,
                border: '1px solid #ff4d4f',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 12,
              }}
            >
              无封面
            </div>
          )
        }
        
        // 判断是否为视频文件
        const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('video')
        
        if (isVideo) {
          return (
            <video
              src={url}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setPreviewImage({ visible: true, url })}
              muted
              onError={(e) => {
                ;(e.target as HTMLVideoElement).style.display = 'none'
              }}
            />
          )
        }
        
        return (
          <img
            src={url}
            alt="封面"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => setPreviewImage({ visible: true, url })}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/60'
            }}
          />
        )
      },
    },
    {
      title: '相册名称',
      dataIndex: 'album_name',
      key: 'album_name',
      width: 150,
    },
    {
      title: '功能类型',
      dataIndex: 'function_type',
      key: 'function_type',
      width: 120,
      render: (type: string) => {
        const label = getCategoryLabel(type, 'function_type')
        return <Tag>{label}</Tag>
      },
    },
    {
      title: '主题风格',
      dataIndex: 'theme_styles',
      key: 'theme_styles',
      width: 200,
      render: (styles: string[]) => (
        <Space size={[0, 8]} wrap>
          {styles?.map((style) => {
            const label = getCategoryLabel(style, 'theme_style')
            return <Tag key={style}>{label}</Tag>
          })}
        </Space>
      ),
    },
    {
      title: '活动标签',
      dataIndex: 'activity_tags',
      key: 'activity_tags',
      width: 150,
      render: (tags: string[]) => (
        <Space size={[0, 8]} wrap>
          {tags?.map((tag) => {
            const label = getCategoryLabel(tag, 'activity_tag')
            return <Tag key={tag} color="orange">{label}</Tag>
          })}
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const levelMap: Record<string, { text: string; color: string }> = {
          '0': { text: '免费', color: 'green' },
          '1': { text: '高级', color: 'blue' },
          '2': { text: 'VIP', color: 'purple' },
        }
        const info = levelMap[level] || { text: level, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price: number) => `${price} 美美币`,
    },
    {
      title: '权重',
      dataIndex: 'sort_weight',
      key: 'sort_weight',
      width: 120,
      render: (sortWeight: number, record: AlbumRecord) => {
        const isEditing = editingWeightId === record.album_id
        
        const handleBlur = () => {
          if (isEditing) {
            if (editingWeightValue !== sortWeight) {
              handleUpdateSortWeight(record.album_id, editingWeightValue)
            }
            setEditingWeightId(null)
          }
        }
        
        const handleKeyPress = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            handleBlur()
          } else if (e.key === 'Escape') {
            setEditingWeightId(null)
          }
        }
        
        if (isEditing) {
          return (
            <InputNumber
              value={editingWeightValue}
              onChange={(value) => setEditingWeightValue(value || 0)}
              onBlur={handleBlur}
              onPressEnter={handleBlur}
              onKeyDown={handleKeyPress}
              autoFocus
              style={{ width: 80 }}
              min={0}
              onClick={(e) => e.stopPropagation()}
            />
          )
        }
        
        return (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setEditingWeightId(record.album_id)
              setEditingWeightValue(sortWeight || 0)
            }}
            style={{ cursor: 'pointer', padding: '4px 8px', display: 'inline-block' }}
            title="点击编辑权重"
          >
            {sortWeight || 0}
          </span>
        )
      },
    },
    {
      title: '发布状态',
      dataIndex: 'published',
      key: 'published',
      width: 100,
      render: (published: boolean, record: AlbumRecord) => (
        <Switch
          checked={published}
          onChange={(checked) => handleTogglePublish(record.album_id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: AlbumRecord) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div className="flex">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={{ name: '管理员', avatarUrl: '' }} title="相册管理" />
        <main className="p-6 mt-16">
          <Table
        columns={columns}
        dataSource={albums}
        rowKey="album_id"
        loading={loading}
        scroll={{ x: 1400 }}
        components={{
          body: {
            row: (props: any) => {
              // 从 props 中获取 rowKey，Ant Design Table 会将 rowKey 作为 data-row-key 属性
              const rowKey = props['data-row-key'] || 
                            props['data-rowkey'] ||
                            (Array.isArray(props.children) && props.children[0]?.props?.record?.album_id)
              
              // 根据 rowKey 找到对应的 record
              const record = rowKey ? albums.find((a) => a.album_id === rowKey) : null
              const description = record?.album_description || '暂无描述'
              
              // 使用 Tooltip 包裹 tr 元素
              return (
                <Tooltip title={description} placement="topLeft" mouseEnterDelay={0.3}>
                  <tr {...props} />
                </Tooltip>
              )
            },
          },
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            fetchAlbums(page, pageSize)
          },
        }}
      />

      {/* 编辑Modal */}
      <Modal
        title="编辑相册"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingAlbum(null)
          setSrcImageFile(null)
          setSrcImagePreview('')
          setResultImageFile(null)
          setResultImagePreview('')
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        {editingAlbum && (
          <div style={{ padding: '20px 0', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>相册名称：</label>
              <Input 
                value={editingAlbum.album_name} 
                onChange={(e) => {
                  setEditingAlbum({ ...editingAlbum, album_name: e.target.value })
                }}
                placeholder="输入相册名称"
              />
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>功能类型：</label>
                  <Select
                    value={editingAlbum.function_type}
                    onChange={(value) => {
                      setEditingAlbum({ ...editingAlbum, function_type: value })
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择功能类型"
                  >
                    {functionTypeOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    选择模型：
                    <Tooltip title="选择模型，决定调用哪个云函数以及需要填写哪些参数">
                      <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                    </Tooltip>
                  </label>
                  <Select
                    value={editingAlbum.task_execution_type}
                    onChange={(value) => {
                      const nextAlbum: AlbumRecord = { ...editingAlbum, task_execution_type: value }
                      if (value === 'async_image_to_video' && nextAlbum.enable_custom_prompt === undefined) {
                        nextAlbum.enable_custom_prompt = true
                      }
                      setEditingAlbum(nextAlbum)
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择模型"
                  >
                    {taskExecutionTypeOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>主题风格：</label>
                  <Select
                    mode="multiple"
                    value={editingAlbum.theme_styles}
                    onChange={(values) => {
                      setEditingAlbum({ ...editingAlbum, theme_styles: values })
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择主题风格"
                  >
                    {themeStyleOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>活动标签：</label>
                  <Select
                    mode="multiple"
                    value={editingAlbum.activity_tags}
                    onChange={(values) => {
                      setEditingAlbum({ ...editingAlbum, activity_tags: values })
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择活动标签"
                  >
                    {activityTagOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            {/* 根据 task_execution_type 显示不同的配置区域 */}
            
            {/* 异步任务 - 视频特效配置 */}
            {editingAlbum.task_execution_type === 'async_video_effect' && (
              <>
                <Divider>视频特效配置</Divider>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>特效模板（template）：</label>
                  <Select
                    value={editingAlbum.video_effect_template || ''}
                    onChange={(value) => {
                      setEditingAlbum({ ...editingAlbum, video_effect_template: value })
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择特效模板"
                    allowClear
                  >
                    <Option value="flying">魔法悬浮 (flying)</Option>
                    <Option value="squish">解压捏捏 (squish)</Option>
                    <Option value="rotation">转圈圈 (rotation)</Option>
                    <Option value="poke">戳戳乐 (poke)</Option>
                    <Option value="inflate">气球膨胀 (inflate)</Option>
                    <Option value="dissolve">分子扩散 (dissolve)</Option>
                    <Option value="melt">热浪融化 (melt)</Option>
                    <Option value="icecream">冰淇淋星球 (icecream)</Option>
                    <Option value="carousel">时光木马 (carousel)</Option>
                    <Option value="singleheart">爱你哟 (singleheart)</Option>
                    <Option value="dance1">摇摆时刻 (dance1)</Option>
                    <Option value="dance2">头号甩舞 (dance2)</Option>
                    <Option value="dance3">星摇时刻 (dance3)</Option>
                    <Option value="dance4">指感节奏 (dance4)</Option>
                    <Option value="dance5">舞动开关 (dance5)</Option>
                    <Option value="mermaid">人鱼觉醒 (mermaid)</Option>
                    <Option value="graduation">学术加冕 (graduation)</Option>
                    <Option value="dragon">巨兽追袭 (dragon)</Option>
                    <Option value="money">财从天降 (money)</Option>
                    <Option value="jellyfish">水母之约 (jellyfish)</Option>
                    <Option value="pupil">瞳孔穿越 (pupil)</Option>
                    <Option value="rose">赠人玫瑰 (rose)</Option>
                    <Option value="crystalrose">闪亮玫瑰 (crystalrose)</Option>
                    <Option value="hug">爱的抱抱 (hug)</Option>
                    <Option value="frenchkiss">唇齿相依 (frenchkiss)</Option>
                    <Option value="coupleheart">双倍心动 (coupleheart)</Option>
                    <Option value="hanfu-1">唐韵翩然 (hanfu-1)</Option>
                    <Option value="solaron">机甲变身 (solaron)</Option>
                    <Option value="magazine">闪耀封面 (magazine)</Option>
                    <Option value="mech1">机械觉醒 (mech1)</Option>
                    <Option value="mech2">赛博登场 (mech2)</Option>
                  </Select>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    提示：视频特效使用首帧图片生成特效视频，无需提示词
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>首帧图片（src_image）：</label>
                  <Row gutter={16} align="top">
                    <Col span={12}>
                      <div style={{ maxWidth: 200 }}>
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          beforeUpload={() => false}
                          onChange={handleSrcImageChange}
                          accept="image/*"
                          showUploadList={false}
                        >
                          {(srcImagePreview || editingAlbum.src_image) ? (
                            <Image
                              src={srcImagePreview || editingAlbum.src_image}
                              alt="首帧图片"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              preview={false}
                            />
                          ) : (
                            <div>
                              <UploadOutlined />
                              <div style={{ marginTop: 8 }}>上传首帧图片</div>
                            </div>
                          )}
                        </Upload>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>首帧图片URL（src_image）：</div>
                        <Input
                          value={editingAlbum.src_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, src_image: e.target.value })
                          }}
                          placeholder="输入或上传首帧图片URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>结果图URL（result_image）：</div>
                        <Input
                          value={editingAlbum.result_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, result_image: e.target.value })
                          }}
                          placeholder="输入或上传结果图URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>预览视频URL（preview_video_url）：</label>
                  <Input
                    value={editingAlbum.preview_video_url || ''}
                    onChange={(e) => {
                      setEditingAlbum({ ...editingAlbum, preview_video_url: e.target.value })
                    }}
                    placeholder="输入预览视频URL（可选）"
                    allowClear
                  />
                </div>
              </>
            )}

            {/* 异步任务 - 人像风格重绘配置 */}
            {editingAlbum.task_execution_type === 'async_portrait_style_redraw' && (
              <>
                <Divider>人像风格重绘配置</Divider>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>风格索引（style_index）：</label>
                  <Select
                    value={editingAlbum.style_index !== undefined ? editingAlbum.style_index : 0}
                    onChange={(value) => {
                      setEditingAlbum({ 
                        ...editingAlbum, 
                        style_index: value,
                        // 如果不是自定义风格，清空 style_ref_url
                        style_ref_url: value !== -1 ? undefined : editingAlbum.style_ref_url
                      })
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择风格索引"
                  >
                    <Option value={0}>0 - 复古漫画</Option>
                    <Option value={1}>1 - 3D童话</Option>
                    <Option value={2}>2 - 二次元</Option>
                    <Option value={3}>3 - 小清新</Option>
                    <Option value={4}>4 - 未来科技</Option>
                    <Option value={5}>5 - 国画古风</Option>
                    <Option value={6}>6 - 将军百战</Option>
                    <Option value={7}>7 - 炫彩卡通</Option>
                    <Option value={8}>8 - 清雅国风</Option>
                    <Option value={9}>9 - 喜迎新年</Option>
                    <Option value={-1}>-1 - 自定义风格</Option>
                  </Select>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    提示：选择 -1 表示使用自定义风格，需要提供风格参考图URL
                  </div>
                </div>

                {editingAlbum.style_index === -1 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>风格参考图URL（style_ref_url）：</label>
                    <Input
                      value={editingAlbum.style_ref_url || ''}
                      onChange={(e) => {
                        setEditingAlbum({ ...editingAlbum, style_ref_url: e.target.value })
                      }}
                      placeholder="输入风格参考图URL（必填）"
                      allowClear
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      提示：当 style_index 为 -1 时，此字段为必填
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>原始图片（src_image）：</label>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleSrcImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {(srcImagePreview || editingAlbum.src_image) ? (
                          <Image
                            src={srcImagePreview || editingAlbum.src_image}
                            alt="原始图片"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传原始图片</div>
                          </div>
                        )}
                      </Upload>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>图片URL：</div>
                        <Input
                          value={editingAlbum.src_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, src_image: e.target.value })
                          }}
                          placeholder="输入或上传原始图片URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>结果图（result_image）：</label>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleResultImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {(resultImagePreview || editingAlbum.result_image) ? (
                          <Image
                            src={resultImagePreview || editingAlbum.result_image}
                            alt="结果图"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传结果图</div>
                          </div>
                        )}
                      </Upload>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>图片URL：</div>
                        <Input
                          value={editingAlbum.result_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, result_image: e.target.value })
                          }}
                          placeholder="输入或上传结果图URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </>
            )}

            {/* 异步任务 - 图生视频配置 */}
            {editingAlbum.task_execution_type === 'async_image_to_video' && (
              <>
                <Divider>图生视频配置</Divider>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>提示词（prompt_text）：</label>
                  <TextArea
                    value={editingAlbum.prompt_text || ''}
                    onChange={(e) => {
                      setEditingAlbum({ ...editingAlbum, prompt_text: e.target.value })
                    }}
                    rows={4}
                    placeholder="输入提示词，描述要生成的视频效果"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>首帧图片（src_image）：</label>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleSrcImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {(srcImagePreview || editingAlbum.src_image) ? (
                          <Image
                            src={srcImagePreview || editingAlbum.src_image}
                            alt="首帧图片"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传首帧图片</div>
                          </div>
                        )}
                      </Upload>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>图片URL：</div>
                        <Input
                          value={editingAlbum.src_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, src_image: e.target.value })
                          }}
                          placeholder="输入或上传首帧图片URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    支持自定义提示词（enable_custom_prompt）：
                  </label>
                  <Switch
                    checked={editingAlbum.enable_custom_prompt !== false}
                    onChange={(checked) => {
                      setEditingAlbum({ ...editingAlbum, enable_custom_prompt: checked })
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    默认开启：App 端会展示输入框，用户可手动输入想说的话（custom_prompt）
                  </div>
                </div>

                {editingAlbum.enable_custom_prompt !== false && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>默认自定义提示词（custom_prompt，可选）：</label>
                      <TextArea
                        value={editingAlbum.custom_prompt || ''}
                        onChange={(e) => {
                          setEditingAlbum({ ...editingAlbum, custom_prompt: e.target.value })
                        }}
                        rows={2}
                        placeholder="可为空；若填写，App 输入框默认填入该值"
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>小贴士（custom_prompt_tips，可选）：</label>
                      <TextArea
                        value={editingAlbum.custom_prompt_tips || ''}
                        onChange={(e) => {
                          setEditingAlbum({ ...editingAlbum, custom_prompt_tips: e.target.value })
                        }}
                        rows={2}
                        placeholder="会在 App 输入框附近展示为小贴士"
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>预览视频URL（preview_video_url）：</label>
                  <Input
                    value={editingAlbum.preview_video_url || ''}
                    onChange={(e) => {
                      setEditingAlbum({ ...editingAlbum, preview_video_url: e.target.value })
                    }}
                    placeholder="输入预览视频URL（可选）"
                    allowClear
                  />
                </div>
              </>
            )}

            {/* 异步任务 - 图生图配置 */}
            {editingAlbum.task_execution_type === 'async_image_to_image' && (
              <>
                <Divider>图生图配置</Divider>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>原始图（src_image）：</label>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleSrcImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {(srcImagePreview || editingAlbum.src_image) ? (
                          <Image
                            src={srcImagePreview || editingAlbum.src_image}
                            alt="原始图"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传原始图</div>
                          </div>
                        )}
                      </Upload>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>图片URL：</div>
                        <Input
                          value={editingAlbum.src_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, src_image: e.target.value })
                          }}
                          placeholder="输入或上传原始图URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>结果图（result_image）：</label>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleResultImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {(resultImagePreview || editingAlbum.result_image) ? (
                          <Image
                            src={resultImagePreview || editingAlbum.result_image}
                            alt="结果图"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传结果图</div>
                          </div>
                        )}
                      </Upload>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>图片URL：</div>
                        <Input
                          value={editingAlbum.result_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, result_image: e.target.value })
                          }}
                          placeholder="输入或上传结果图URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Prompt文本（prompt_text）：</label>
                  <TextArea
                    value={editingAlbum.prompt_text || ''}
                    onChange={(e) => {
                      setEditingAlbum({ ...editingAlbum, prompt_text: e.target.value })
                    }}
                    rows={4}
                    placeholder="输入Prompt文本"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>风格描述（style_description）：</label>
                  <TextArea
                    value={editingAlbum.style_description || ''}
                    onChange={(e) => {
                      setEditingAlbum({ ...editingAlbum, style_description: e.target.value })
                    }}
                    rows={3}
                    placeholder="输入风格描述"
                  />
                </div>
              </>
            )}

            {/* 异步任务 - 豆包图生图配置 */}
            {editingAlbum.task_execution_type === 'async_doubao_image_to_image' && (
              <>
                <Divider>豆包图生图配置</Divider>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>Prompt文本（prompt_text）：</label>
                      <TextArea
                        value={editingAlbum.prompt_text || ''}
                        onChange={(e) => {
                          setEditingAlbum({ ...editingAlbum, prompt_text: e.target.value })
                        }}
                        rows={4}
                        placeholder="输入Prompt文本，描述要生成的图片效果"
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        提示：豆包图生图支持1张或多张参考图片，请确保已上传原始图
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>风格描述（style_description）：</label>
                      <TextArea
                        value={editingAlbum.style_description || ''}
                        onChange={(e) => {
                          setEditingAlbum({ ...editingAlbum, style_description: e.target.value })
                        }}
                        rows={4}
                        placeholder="输入风格描述（可选）"
                      />
                    </div>
                  </Col>
                </Row>

                {/* 原始图上传组件（使用 src_images） */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>原始图：</label>
                  <Row gutter={16}>
                    {/* 原始图1 */}
                    <Col span={6}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>原始图1（src_images[0]）：</div>
                        <div style={{ 
                          width: '100%', 
                          border: '1px solid #d9d9d9', 
                          borderRadius: 4,
                          padding: 8,
                          backgroundColor: '#fafafa'
                        }}>
                          <div style={{ 
                            width: '100%', 
                            aspectRatio: '1',
                            marginBottom: 8,
                            border: '1px solid #e8e8e8',
                            borderRadius: 4,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            position: 'relative'
                          }}>
                            <Upload
                              listType="picture-card"
                              maxCount={1}
                              beforeUpload={() => false}
                              onChange={handleSrcImage1Change}
                              accept="image/*"
                              showUploadList={false}
                              style={{ width: '100%', height: '100%' }}
                            >
                              {(srcImage1Preview || editingAlbum.src_images?.[0]) ? (
                                <div style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  position: 'relative'
                                }}>
                                  <img
                                    src={srcImage1Preview || editingAlbum.src_images?.[0]}
                                    alt="原始图1"
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      pointerEvents: 'none'
                                    }}
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      padding: '4px 8px',
                                      borderRadius: 4,
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      zIndex: 10
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const url = srcImage1Preview || editingAlbum.src_images?.[0]
                                      if (url) {
                                        setPreviewImage({ visible: true, url })
                                      }
                                    }}
                                    title="点击预览大图"
                                  >
                                    预览
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <UploadOutlined />
                                  <div style={{ marginTop: 8 }}>上传原始图1</div>
                                </div>
                              )}
                            </Upload>
                          </div>
                          <Input
                            value={editingAlbum.src_images?.[0] || ''}
                            onChange={(e) => {
                              const srcImages = editingAlbum.src_images || []
                              srcImages[0] = e.target.value
                              setEditingAlbum({ ...editingAlbum, src_images: srcImages })
                            }}
                            placeholder="输入或上传原始图1 URL"
                            style={{ fontSize: 12 }}
                            allowClear
                          />
                        </div>
                      </div>
                    </Col>

                    {/* 原始图2 - 仅在多人合拍模式或已有图2时显示 */}
                    {(editingAlbum.is_multi_person === true || editingAlbum.src_images?.[1]) && (
                      <Col span={6}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>原始图2（src_images[1]）：</div>
                          <div style={{ 
                            width: '100%', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: 4,
                            padding: 8,
                            backgroundColor: '#fafafa'
                          }}>
                            <div style={{ 
                              width: '100%', 
                              aspectRatio: '1',
                              marginBottom: 8,
                              border: '1px solid #e8e8e8',
                              borderRadius: 4,
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fff',
                              position: 'relative'
                            }}>
                              <Upload
                                listType="picture-card"
                                maxCount={1}
                                beforeUpload={() => false}
                                onChange={handleSrcImage2Change}
                                accept="image/*"
                                showUploadList={false}
                                style={{ width: '100%', height: '100%' }}
                              >
                                {(srcImage2Preview || editingAlbum.src_images?.[1]) ? (
                                  <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    position: 'relative'
                                  }}>
                                    <img
                                      src={srcImage2Preview || editingAlbum.src_images?.[1]}
                                      alt="原始图2"
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        pointerEvents: 'none'
                                      }}
                                      onError={(e) => {
                                        ;(e.target as HTMLImageElement).style.display = 'none'
                                      }}
                                    />
                                    <div 
                                      style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        color: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        zIndex: 10
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const url = srcImage2Preview || editingAlbum.src_images?.[1]
                                        if (url) {
                                          setPreviewImage({ visible: true, url })
                                        }
                                      }}
                                      title="点击预览大图"
                                    >
                                      预览
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>上传原始图2</div>
                                  </div>
                                )}
                              </Upload>
                            </div>
                            <Input
                              value={editingAlbum.src_images?.[1] || ''}
                              onChange={(e) => {
                                const srcImages = editingAlbum.src_images || []
                                srcImages[1] = e.target.value
                                setEditingAlbum({ ...editingAlbum, src_images: srcImages })
                              }}
                              placeholder="输入或上传原始图2 URL"
                              style={{ fontSize: 12 }}
                              allowClear
                            />
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>

                <Row gutter={16}>
                  <Col span={6}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>结果图（result_image）：</label>
                      <div style={{ 
                        width: '100%', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: 4,
                        padding: 8,
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ 
                          width: '100%', 
                          aspectRatio: '1',
                          marginBottom: 8,
                          border: '1px solid #e8e8e8',
                          borderRadius: 4,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fff',
                          position: 'relative'
                        }}>
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            onChange={handleResultImageChange}
                            accept="image/*"
                            showUploadList={false}
                            style={{ width: '100%', height: '100%' }}
                          >
                            {(resultImagePreview || editingAlbum.result_image) ? (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                position: 'relative'
                              }}>
                                <img
                                  src={resultImagePreview || editingAlbum.result_image}
                                  alt="结果图"
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    pointerEvents: 'none'
                                  }}
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                                <div 
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    zIndex: 10
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const url = resultImagePreview || editingAlbum.result_image
                                    if (url) {
                                      setPreviewImage({ visible: true, url })
                                    }
                                  }}
                                  title="点击预览大图"
                                >
                                  预览
                                </div>
                              </div>
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>上传结果图</div>
                              </div>
                            )}
                          </Upload>
                        </div>
                        <Input
                          value={editingAlbum.result_image || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, result_image: e.target.value })
                          }}
                          placeholder="输入或上传结果图URL"
                          style={{ fontSize: 12 }}
                          allowClear
                        />
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    {/* 空列，保持布局平衡 */}
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        排除结果图（exclude_result_image）：
                        <Tooltip title="开启后，生图时将不参考 result_image，仅使用用户自拍图 + prompt 生成。默认开启（即不参考 result_image）。图片数组顺序：result_image 在首位，后续为用户自拍。">
                          <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                        </Tooltip>
                      </label>
                      <Switch
                        checked={editingAlbum.exclude_result_image !== false}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, exclude_result_image: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        当前图片数组顺序：<strong>{
                          editingAlbum.exclude_result_image !== false
                            ? (editingAlbum.is_multi_person === true ? '[selfie1, selfie2]' : '[selfie1]')
                            : (editingAlbum.is_multi_person === true ? '[result_image, selfie1, selfie2]' : '[result_image, selfie1]')
                        }</strong> + prompt
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        多人合拍模式（is_multi_person）：
                        <Tooltip title="开启后，强制要求用户上传2张自拍。默认关闭（即单人模式，只需1张自拍）。">
                          <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                        </Tooltip>
                      </label>
                      <Switch
                        checked={editingAlbum.is_multi_person === true}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, is_multi_person: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        {editingAlbum.is_multi_person === true ? '多人合拍模式（需要2张自拍）' : '单人模式（默认：只需1张自拍）'}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row gutter={16}>
                  
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        支持自定义提示词（enable_custom_prompt）：
                      </label>
                      <Switch
                        checked={editingAlbum.enable_custom_prompt !== false}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, enable_custom_prompt: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        默认开启：App 端会展示输入框，用户可手动输入想说的话（custom_prompt）
                      </div>
                    </div>
                  </Col>
                </Row>

                {editingAlbum.enable_custom_prompt !== false && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>默认自定义提示词（custom_prompt，可选）：</label>
                        <TextArea
                          value={editingAlbum.custom_prompt || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, custom_prompt: e.target.value })
                          }}
                          rows={2}
                          placeholder="可为空；若填写，App 输入框默认填入该值"
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>小贴士（custom_prompt_tips，可选）：</label>
                        <TextArea
                          value={editingAlbum.custom_prompt_tips || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, custom_prompt_tips: e.target.value })
                          }}
                          rows={2}
                          placeholder="会在 App 输入框附近展示为小贴士"
                        />
                      </div>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {/* 异步任务 - 混元生图配置 */}
            {editingAlbum.task_execution_type === 'async_hunyuan_image' && (
              <>
                <Divider>混元生图配置</Divider>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>Prompt文本（prompt_text）：</label>
                      <TextArea
                        value={editingAlbum.prompt_text || ''}
                        onChange={(e) => {
                          setEditingAlbum({ ...editingAlbum, prompt_text: e.target.value })
                        }}
                        rows={4}
                        placeholder="输入Prompt文本，描述要生成的图片"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>生成图分辨率（hunyuan_resolution）：</label>
                      <Select
                        value={editingAlbum.hunyuan_resolution || '720:1280'}
                        onChange={(value) => {
                          setEditingAlbum({ ...editingAlbum, hunyuan_resolution: value })
                        }}
                        style={{ width: '100%' }}
                      >
                        <Option value="720:1280">720:1280（9:16 竖图）</Option>
                        <Option value="1280:720">1280:720（16:9 横图）</Option>
                        <Option value="768:1024">768:1024（3:4 竖图）</Option>
                        <Option value="1024:768">1024:768（4:3 横图）</Option>
                        <Option value="768:1280">768:1280（3:5 竖图）</Option>
                        <Option value="1280:768">1280:768（5:3 横图）</Option>
                        <Option value="768:768">768:768（1:1 方图）</Option>
                        <Option value="1024:1024">1024:1024（1:1 方图）</Option>
                      </Select>
                    </div>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        多人合拍模式（is_multi_person）：
                        <Tooltip title="开启后，需两张原始图；客户端相册卡片将展示两个头像（如情侣拜年样式）。">
                          <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                        </Tooltip>
                      </label>
                      <Switch
                        checked={editingAlbum.is_multi_person === true}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, is_multi_person: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        {editingAlbum.is_multi_person === true ? '已开启：客户端显示两张头像' : '已关闭：客户端显示一张头像'}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        Prompt 扩写（hunyuan_revise）：
                        <Tooltip title="开启后，混元会自动扩写输入的 prompt 并使用扩写后的 prompt 生成图片。默认关闭。">
                          <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                        </Tooltip>
                      </label>
                      <Switch
                        checked={editingAlbum.hunyuan_revise === true}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, hunyuan_revise: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        {editingAlbum.hunyuan_revise === true ? '已开启：混元将自动扩写 prompt' : '已关闭：使用原始 prompt 生图'}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8 }}>
                        支持自定义提示词（enable_custom_prompt）：
                      </label>
                      <Switch
                        checked={editingAlbum.enable_custom_prompt !== false}
                        onChange={(checked) => {
                          setEditingAlbum({ ...editingAlbum, enable_custom_prompt: checked })
                        }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        默认开启：App 端会展示输入框，用户可手动输入想说的话
                      </div>
                    </div>
                  </Col>
                </Row>

                {editingAlbum.enable_custom_prompt !== false && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>默认自定义提示词（custom_prompt，可选）：</label>
                        <TextArea
                          value={editingAlbum.custom_prompt || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, custom_prompt: e.target.value })
                          }}
                          rows={2}
                          placeholder="可为空；若填写，App 输入框默认填入该值"
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>小贴士（custom_prompt_tips，可选）：</label>
                        <TextArea
                          value={editingAlbum.custom_prompt_tips || ''}
                          onChange={(e) => {
                            setEditingAlbum({ ...editingAlbum, custom_prompt_tips: e.target.value })
                          }}
                          rows={2}
                          placeholder="会在 App 输入框附近展示为小贴士"
                        />
                      </div>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 图片/视频预览 Modal */}
      <Modal
        open={previewImage.visible}
        footer={null}
        onCancel={() => setPreviewImage({ visible: false, url: '' })}
        width={800}
        centered
        style={{ maxWidth: '90vw' }}
        bodyStyle={{ maxHeight: '90vh', overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {previewImage.url && (previewImage.url.toLowerCase().endsWith('.mp4') || previewImage.url.toLowerCase().includes('video')) ? (
          <video
            src={previewImage.url}
            controls
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh', 
              height: 'auto',
              width: 'auto',
              display: 'block',
            }}
          />
        ) : (
          <img
            src={previewImage.url}
            alt="预览"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh', 
              height: 'auto',
              width: 'auto',
              display: 'block',
              objectFit: 'contain'
            }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/800'
            }}
          />
        )}
      </Modal>
        </main>
      </div>
    </div>
  )
}

