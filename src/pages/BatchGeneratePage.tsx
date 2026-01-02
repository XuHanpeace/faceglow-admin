import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Button,
  Select,
  message,
  Row,
  Col,
  Image,
  Divider,
  InputNumber,
  Input,
  Upload,
  Switch,
  Tooltip,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { cosUploadService } from '../services/cosUpload'
import { albumService } from '../services/albumService'
import { categoryService } from '../services/categoryService'
import { AlbumLevel } from '../types/album'
import type { AlbumRecord } from '../types/album'
import type { CategoryConfigRecord } from '../types/category'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useNavigate, useLocation } from 'react-router-dom'

const { TextArea } = Input
const { Option } = Select

interface FormData {
  function_type: string
  album_name: string
  album_description: string
  prompt_text?: string
  level: string
  price: number
  sort_weight: number
  theme_styles: string[]
  activity_tags: string[]
  task_execution_type: string
  // 人像风格重绘相关
  style_index?: number
  style_ref_url?: string
  // 视频特效相关
  video_effect_template?: string
  // 图生视频相关
  audio_url?: string
  // 豆包图生图相关
  exclude_result_image?: boolean
}

export default function BatchGeneratePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('batch-generate')
  const [form] = Form.useForm<FormData>()
  const [loading, setLoading] = useState(false)

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

  const [categories, setCategories] = useState<CategoryConfigRecord[]>([])
  const [coverImageFile, setCoverImageFile] = useState<UploadFile | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [previewVideoFile, setPreviewVideoFile] = useState<UploadFile | null>(null)
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string>('')
  const [srcImageFile, setSrcImageFile] = useState<UploadFile | null>(null)
  const [srcImagePreview, setSrcImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [previewData, setPreviewData] = useState<Partial<AlbumRecord> | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<{
    album_image?: string
    result_image?: string
    src_image?: string
    preview_video_url?: string
  }>({})
  
  // 监听任务执行类型变化
  const [taskExecutionType, setTaskExecutionType] = useState<string>('async_doubao_image_to_image')

  // 获取Category配置
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoryConfig()
      setCategories(response.data || [])
    } catch (error: unknown) {
      console.error('获取Category配置失败:', error)
      message.error('获取Category配置失败')
    }
  }

  useEffect(() => {
    fetchCategories()
    // 初始化时设置 taskExecutionType
    const initialType = form.getFieldValue('task_execution_type') || 'async_doubao_image_to_image'
    setTaskExecutionType(initialType)
  }, [])

  // 实时更新JSON预览
  const updatePreview = () => {
    const data = getPreviewData()
    setPreviewData(data)
  }

  // 监听表单字段变化
  const handleFormChange = (changedValues: any, allValues: any) => {
    // 监听任务执行类型变化
    if (changedValues.task_execution_type !== undefined) {
      setTaskExecutionType(changedValues.task_execution_type)
    }
    updatePreview()
  }

  // 当图片文件或上传URL变化时更新预览
  useEffect(() => {
    updatePreview()
  }, [coverImageFile, coverImagePreview, previewVideoFile, previewVideoPreview, srcImageFile, srcImagePreview, uploadedUrls])

  // 处理封面图上传（支持图片和视频）
  const handleCoverImageChange = (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setCoverImageFile(null)
      setCoverImagePreview('')
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setCoverImageFile(file as UploadFile)
      
      // 生成预览（支持图片和视频）
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)
    }
  }

  // 处理预览视频上传
  const handlePreviewVideoChange = (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setPreviewVideoFile(null)
      setPreviewVideoPreview('')
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setPreviewVideoFile(file as UploadFile)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewVideoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(fileObj)
    }
  }

  // 处理原始图上传
  const handleSrcImageChange = (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setSrcImageFile(null)
      setSrcImagePreview('')
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
    }
  }

  // 获取JSON预览数据
  const getPreviewData = (): Partial<AlbumRecord> | null => {
    try {
      const formValues = form.getFieldsValue()
      
      // 只要有功能类型就显示预览，其他字段可以为空
      if (!formValues.function_type) {
        return null
      }

      return {
        album_name: formValues.album_name || '',
        album_description: formValues.album_description || '',
        function_type: formValues.function_type,
        prompt_text: formValues.prompt_text || '',
        theme_styles: formValues.theme_styles || [],
        activity_tags: formValues.activity_tags || [],
        level: formValues.level || AlbumLevel.FREE,
        price: formValues.price || 0,
        sort_weight: formValues.sort_weight || 0,
        task_execution_type: formValues.task_execution_type || 'async_doubao_image_to_image',
        likes: 0,
        published: false,
        // 人像风格重绘相关字段
        style_index: formValues.style_index,
        style_ref_url: formValues.style_ref_url,
        // 视频特效相关字段
        video_effect_template: formValues.video_effect_template,
        // 图生视频相关字段
        audio_url: formValues.audio_url,
        // 豆包图生图相关字段
        exclude_result_image: formValues.exclude_result_image,
        // 图片URL：如果已上传则显示真实URL，否则显示待上传
        album_image: uploadedUrls.album_image || (coverImageFile ? '[待上传]' : ''),
        result_image: uploadedUrls.result_image || (coverImageFile ? '[待上传]' : ''),
        src_image: uploadedUrls.src_image || (srcImageFile ? '[待上传]' : ''),
        preview_video_url: uploadedUrls.preview_video_url || (previewVideoFile ? '[待上传]' : ''),
      }
    } catch (error) {
      return null
    }
  }

  // 上传并保存
  const handleSubmit = async () => {
    try {
      const formValues = await form.validateFields()
      
      // 判断是否为视频类型相册（视频特效或图生视频）
      const isVideoType = taskExecutionType === 'async_video_effect' || taskExecutionType === 'async_image_to_video'
      
      // 视频类型需要上传 preview_video_url，非视频类型需要上传封面图
      if (isVideoType) {
        if (!previewVideoFile) {
          message.warning('请上传预览视频')
          return
        }
      } else {
        if (!coverImageFile) {
          message.warning('请上传封面图')
          return
        }
      }

      if (!srcImageFile) {
        message.warning('请上传原始图')
        return
      }

      if (!formValues.album_name?.trim()) {
        message.warning('请填入相册名称')
        return
      }

      if (!formValues.album_description?.trim()) {
        message.warning('请填入相册描述')
        return
      }

      // 视频特效不需要 prompt_text，其他任务都需要
      if (taskExecutionType !== 'async_video_effect' && !formValues.prompt_text?.trim()) {
        message.warning('请填入Prompt文本')
        return
      }

      // 人像风格重绘需要 style_index
      if (taskExecutionType === 'async_portrait_style_redraw') {
        if (formValues.style_index === undefined || formValues.style_index === null) {
          message.warning('请选择风格索引')
          return
        }
        if (formValues.style_index === -1 && !formValues.style_ref_url?.trim()) {
          message.warning('使用自定义风格时，需要提供风格参考图URL')
          return
        }
      }

      // 视频特效需要 template
      if (taskExecutionType === 'async_video_effect' && !formValues.video_effect_template?.trim()) {
        message.warning('请选择特效模板')
        return
      }

      setUploading(true)

      let albumImageUrl = ''
      let previewVideoUrl = ''

      // 1. 根据类型上传封面图或预览视频
      if (isVideoType) {
        // 视频类型：上传预览视频
        const videoFile = previewVideoFile!.originFileObj || (previewVideoFile as unknown as File)
        if (!(videoFile instanceof File)) {
          throw new Error('预览视频文件格式错误')
        }
        const fileExtension = videoFile.name?.split('.').pop() || 'mp4'
        const videoFileName = `preview_video_${Date.now()}.${fileExtension}`
        const videoUploadResult = await cosUploadService.uploadFile({
          file: videoFile,
          fileName: videoFileName,
          folder: 'albums',
        })

        if (!videoUploadResult.success || !videoUploadResult.url) {
          throw new Error(`上传预览视频失败: ${videoUploadResult.error}`)
        }

        previewVideoUrl = videoUploadResult.url
        albumImageUrl = previewVideoUrl // 视频类型：album_image 使用 preview_video_url 的值

        // 更新预览数据中的URL
        setUploadedUrls({
          preview_video_url: previewVideoUrl,
          album_image: albumImageUrl,
          result_image: albumImageUrl,
        })
        updatePreview()
      } else {
        // 非视频类型：上传封面图
        const coverFile = coverImageFile!.originFileObj || (coverImageFile as unknown as File)
        if (!(coverFile instanceof File)) {
          throw new Error('封面图文件格式错误')
        }
        // 获取文件扩展名，支持图片和视频格式
        const fileExtension = coverFile.name?.split('.').pop() || (coverFile.type?.includes('video') ? 'mp4' : 'png')
        const coverFileName = `album_cover_${Date.now()}.${fileExtension}`
        const coverUploadResult = await cosUploadService.uploadFile({
          file: coverFile,
          fileName: coverFileName,
          folder: 'albums',
        })

        if (!coverUploadResult.success || !coverUploadResult.url) {
          throw new Error(`上传封面图失败: ${coverUploadResult.error}`)
        }

        albumImageUrl = coverUploadResult.url

        // 更新预览数据中的URL
        setUploadedUrls({
          album_image: albumImageUrl,
          result_image: albumImageUrl,
        })
        updatePreview()
      }

      // 2. 上传原始图到COS
      const srcFile = srcImageFile.originFileObj || (srcImageFile as unknown as File)
      if (!(srcFile instanceof File)) {
        throw new Error('原始图文件格式错误')
      }
      const srcFileName = `album_src_${Date.now()}.${srcFile.name?.split('.').pop() || 'png'}`
      const srcUploadResult = await cosUploadService.uploadFile({
        file: srcFile,
        fileName: srcFileName,
        folder: 'albums',
      })

      if (!srcUploadResult.success || !srcUploadResult.url) {
        throw new Error(`上传原始图失败: ${srcUploadResult.error}`)
      }

      // 更新预览数据中的URL
      setUploadedUrls(prev => ({
        ...prev,
        src_image: srcUploadResult.url,
      }))
      updatePreview()

      // 3. 构建Album数据并保存到数据库
      const albumData: Omit<AlbumRecord, 'album_id' | 'created_at' | 'updated_at'> = {
        album_name: formValues.album_name,
        album_description: formValues.album_description,
        album_image: albumImageUrl, // 视频类型时使用 preview_video_url 的值，非视频类型使用封面图URL
        result_image: albumImageUrl, // 封面图同时作为result_image
        src_image: srcUploadResult.url,
        theme_styles: formValues.theme_styles || [],
        function_type: formValues.function_type,
        activity_tags: formValues.activity_tags || [],
        task_execution_type: formValues.task_execution_type || 'async_doubao_image_to_image',
        level: formValues.level || AlbumLevel.FREE,
        price: formValues.price || 0,
        prompt_text: formValues.prompt_text || '',
        style_description: formValues.prompt_text || '',
        likes: 0,
        sort_weight: formValues.sort_weight || 0,
        published: false, // 未发布状态
        // 人像风格重绘相关字段
        style_index: formValues.style_index,
        style_ref_url: formValues.style_ref_url,
        // 视频特效相关字段
        video_effect_template: formValues.video_effect_template,
        // 视频类型：preview_video_url 和 album_image 使用相同的值
        preview_video_url: isVideoType ? previewVideoUrl : undefined,
        // 图生视频相关字段
        audio_url: formValues.audio_url,
        // 豆包图生图相关字段
        exclude_result_image: formValues.exclude_result_image || false,
      }

      await albumService.createAlbum(albumData)

      message.success('创建相册成功')

      // 清空表单
      form.resetFields()
      setCoverImageFile(null)
      setCoverImagePreview('')
      setSrcImageFile(null)
      setSrcImagePreview('')
      setUploadedUrls({})
    } catch (error: unknown) {
      console.error('上传或保存失败:', error)
      const errorMessage = error instanceof Error ? error.message : '上传或保存失败'
      message.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // 获取Category选项
  const categoryOptions = categories
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

  return (
    <div className="flex">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={{ name: '管理员', avatarUrl: '' }} title="创建相册" />
        <main className="p-6 mt-16">
          <Row gutter={[24, 24]}>
            {/* 左侧表单 */}
            <Col xs={24} lg={16}>
              <Card title="创建相册" style={{ marginBottom: 24 }}>
                <Form 
                  form={form} 
                  layout="vertical" 
                  onValuesChange={handleFormChange}
                  initialValues={{ 
                    level: AlbumLevel.FREE, 
                    price: 0, 
                    sort_weight: 0,
                    theme_styles: [],
                    activity_tags: [],
                    task_execution_type: 'async_doubao_image_to_image',
                  }}
                >
                  {/* 功能类型和任务执行类型 - 紧凑布局 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item 
                        name="function_type" 
                        label="功能类型" 
                        rules={[{ required: true, message: '请选择功能类型' }]}
                      >
                        <Select placeholder="选择功能类型">
                          {categoryOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item 
                        name="task_execution_type" 
                        label="选择模型" 
                        rules={[{ required: true, message: '请选择模型' }]}
                        tooltip="选择模型，决定调用哪个云函数以及需要填写哪些参数"
                      >
                        <Select 
                          placeholder="选择模型"
                          onChange={(value) => setTaskExecutionType(value)}
                        >
                          <Option value="sync_portrait">同步执行 - 个人写真换脸（调用 fusion）</Option>
                          <Option value="sync_group_photo">同步执行 - 多人合拍换脸（调用 fusion）</Option>
                          <Option value="async_image_to_image">异步执行 - 图生图（调用 callBailian）</Option>
                          <Option value="async_image_to_video">异步执行 - 图生视频（调用 callBailian）</Option>
                          <Option value="async_video_effect">异步执行 - 视频特效（调用 callBailian）</Option>
                          <Option value="async_portrait_style_redraw">异步执行 - 人像风格重绘（调用 callBailian）</Option>
                          <Option value="async_doubao_image_to_image">异步执行 - 豆包图生图（调用 callBailian）</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  {/* 相册名称和描述 - 紧凑布局 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item 
                        name="album_name" 
                        label="相册名称" 
                        rules={[{ required: true, message: '请填入相册名称' }]}
                      >
                        <Input placeholder="输入相册名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="level" label="相册等级">
                        <Select>
                          <Option value={AlbumLevel.FREE}>免费</Option>
                          <Option value={AlbumLevel.PREMIUM}>高级</Option>
                          <Option value={AlbumLevel.VIP}>VIP</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="album_description" 
                    label="相册描述" 
                    rules={[{ required: true, message: '请填入相册描述' }]}
                  >
                    <TextArea 
                      rows={2} 
                      placeholder="输入相册描述"
                    />
                  </Form.Item>

                  <Divider />

                  {/* 图片/视频上传 - 紧凑布局 */}
                  <Row gutter={16}>
                    {/* 视频类型：显示预览视频上传，隐藏封面图 */}
                    {(taskExecutionType === 'async_video_effect' || taskExecutionType === 'async_image_to_video') ? (
                      <Col span={12}>
                        <Form.Item label="预览视频（preview_video_url）" required>
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            onChange={handlePreviewVideoChange}
                            accept="video/mp4"
                          >
                            {previewVideoPreview ? (
                              <video
                                src={previewVideoPreview}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                }}
                                controls={false}
                                muted
                              />
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>上传预览视频</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                    ) : (
                      <Col span={12}>
                        <Form.Item label="封面图（album_image）" required>
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            beforeUpload={() => false}
                            onChange={handleCoverImageChange}
                            accept="image/*,video/mp4"
                          >
                            {coverImagePreview ? (
                              coverImagePreview.startsWith('data:video/') ? (
                                <video
                                  src={coverImagePreview}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                  }}
                                  controls={false}
                                  muted
                                />
                              ) : (
                                <Image
                                  src={coverImagePreview}
                                  alt="封面图预览"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  preview={false}
                                />
                              )
                            ) : (
                              <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>上传封面图/视频</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                    )}
                    <Col span={12}>
                      <Form.Item label="原始图（src_image）" required>
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          beforeUpload={() => false}
                          onChange={handleSrcImageChange}
                          accept="image/*"
                        >
                          {srcImagePreview ? (
                            <Image
                              src={srcImagePreview}
                              alt="原始图预览"
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
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  {/* 根据任务执行类型显示不同的配置字段 */}
                  
                  {/* 人像风格重绘配置 */}
                  {taskExecutionType === 'async_portrait_style_redraw' && (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            name="style_index" 
                            label="风格索引（style_index）" 
                            rules={[{ required: true, message: '请选择风格索引' }]}
                            tooltip="0-9为预设风格，-1为自定义风格"
                          >
                            <Select placeholder="选择风格索引">
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
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            noStyle
                            shouldUpdate={(prevValues: Record<string, any>, currentValues: Record<string, any>) => 
                              prevValues?.style_index !== currentValues?.style_index
                            }
                          >
                            {({ getFieldValue }) => {
                              const styleIndex = getFieldValue('style_index')
                              if (styleIndex === -1) {
                                return (
                                  <Form.Item 
                                    name="style_ref_url" 
                                    label="风格参考图URL（style_ref_url）" 
                                    rules={[
                                      { required: true, message: '自定义风格需要提供参考图URL' }
                                    ]}
                                  >
                                    <Input placeholder="输入风格参考图URL" />
                                  </Form.Item>
                                )
                              }
                              return null
                            }}
                          </Form.Item>
                        </Col>
                      </Row>
                      <Divider />
                    </>
                  )}

                  {/* 视频特效配置 */}
                  {taskExecutionType === 'async_video_effect' && (
                    <>
                      <Form.Item 
                        name="video_effect_template" 
                        label="特效模板（template）" 
                        rules={[{ required: true, message: '请选择特效模板' }]}
                        tooltip="视频特效使用首帧图片生成特效视频，无需提示词"
                      >
                        <Select placeholder="选择特效模板">
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
                      </Form.Item>
                      <Divider />
                    </>
                  )}

                  {/* 图生视频配置 */}
                  {taskExecutionType === 'async_image_to_video' && (
                    <>
                      <Form.Item 
                        name="audio_url" 
                        label="音频URL（audio_url，可选）"
                        tooltip="图生视频音频URL，仅wan2.5-i2v-preview支持"
                      >
                        <Input placeholder="输入音频URL（可选）" />
                      </Form.Item>
                      <Divider />
                    </>
                  )}

                  {/* 豆包图生图配置 */}
                  {taskExecutionType === 'async_doubao_image_to_image' && (
                    <>
                      <Form.Item 
                        name="exclude_result_image" 
                        label={
                          <span>
                            排除结果图（exclude_result_image）：
                            <Tooltip title="开启后，生图时将不参考 result_image，仅使用用户自拍图 + prompt 生成。默认关闭（即参考 result_image），保持历史版本兼容。">
                              <span style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }}>❓</span>
                            </Tooltip>
                          </span>
                        }
                        valuePropName="checked"
                        initialValue={false}
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues: Record<string, any>, currentValues: Record<string, any>) => 
                          prevValues?.exclude_result_image !== currentValues?.exclude_result_image
                        }
                      >
                        {({ getFieldValue }) => {
                          const excludeResultImage = getFieldValue('exclude_result_image')
                          return (
                            <div style={{ marginBottom: 16, marginTop: -16 }}>
                              <span style={{ fontSize: 12, color: '#666', marginLeft: 24 }}>
                                {excludeResultImage 
                                  ? '不参考 result_image，仅使用用户自拍图 + prompt' 
                                  : '参考 result_image（默认：用户自拍图 + result_image + prompt）'}
                              </span>
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666', marginLeft: 24 }}>
                                提示：默认参考 result_image（用户自拍图 + result_image + prompt）。开启后仅使用用户自拍图 + prompt 生图，不参考 result_image。
                              </div>
                            </div>
                          )
                        }}
                      </Form.Item>
                      <Divider />
                    </>
                  )}

                  {/* Prompt文本 - 视频特效不需要，其他任务都需要 */}
                  {taskExecutionType !== 'async_video_effect' && (
                    <Form.Item 
                      name="prompt_text" 
                      label="Prompt文本" 
                      rules={[{ required: true, message: '请填入Prompt文本' }]}
                    >
                      <TextArea 
                        rows={3} 
                        placeholder="输入Prompt文本"
                      />
                    </Form.Item>
                  )}

                  <Divider />

                  {/* 主题风格和活动标签 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="theme_styles" label="主题风格（可选）">
                        <Select
                          mode="multiple"
                          placeholder="选择主题风格"
                          style={{ width: '100%' }}
                        >
                          {themeStyleOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="activity_tags" label="活动标签（可选）">
                        <Select
                          mode="multiple"
                          placeholder="选择活动标签"
                          style={{ width: '100%' }}
                        >
                          {activityTagOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 价格和排序权重 - 紧凑布局 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="price" label="价格（美美币）">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sort_weight" label="排序权重">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 提交按钮 */}
                  <Form.Item>
                    <Button 
                      type="primary" 
                      onClick={handleSubmit} 
                      loading={uploading}
                      size="large"
                      block
                    >
                      确认并保存
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* 右侧JSON预览 */}
            <Col xs={24} lg={8}>
              <Card title="JSON预览" style={{ position: 'sticky', top: 80 }}>
                {previewData ? (
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    maxHeight: 'calc(100vh - 200px)',
                    overflow: 'auto',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}>
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>
                    请填写表单以查看预览
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </main>
      </div>
    </div>
  )
}
