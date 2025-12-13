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
  prompt_text: string
  level: string
  price: number
  sort_weight: number
  theme_styles: string[]
  activity_tags: string[]
  task_execution_type: string
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
  const [srcImageFile, setSrcImageFile] = useState<UploadFile | null>(null)
  const [srcImagePreview, setSrcImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [previewData, setPreviewData] = useState<Partial<AlbumRecord> | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<{
    album_image?: string
    result_image?: string
    src_image?: string
  }>({})

  // 获取Category配置
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoryConfig()
      setCategories(response.data || [])
    } catch (error: any) {
      console.error('获取Category配置失败:', error)
      message.error('获取Category配置失败')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 实时更新JSON预览
  const updatePreview = () => {
    const data = getPreviewData()
    setPreviewData(data)
  }

  // 监听表单字段变化
  const handleFormChange = () => {
    updatePreview()
  }

  // 当图片文件或上传URL变化时更新预览
  useEffect(() => {
    updatePreview()
  }, [coverImageFile, coverImagePreview, srcImageFile, srcImagePreview, uploadedUrls])

  // 处理封面图上传
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
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
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
        task_execution_type: formValues.task_execution_type || 'sync',
        likes: 0,
        published: false,
        // 图片URL：如果已上传则显示真实URL，否则显示待上传
        album_image: uploadedUrls.album_image || (coverImageFile ? '[待上传]' : ''),
        result_image: uploadedUrls.result_image || (coverImageFile ? '[待上传]' : ''),
        src_image: uploadedUrls.src_image || (srcImageFile ? '[待上传]' : ''),
      }
    } catch (error) {
      return null
    }
  }

  // 上传并保存
  const handleSubmit = async () => {
    try {
      const formValues = await form.validateFields()
      
      if (!coverImageFile) {
        message.warning('请上传封面图')
        return
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

      if (!formValues.prompt_text?.trim()) {
        message.warning('请填入Prompt文本')
        return
      }

      setUploading(true)

      // 1. 上传封面图到COS
      const coverFile = coverImageFile.originFileObj || (coverImageFile as unknown as File)
      if (!(coverFile instanceof File)) {
        throw new Error('封面图文件格式错误')
      }
      const coverFileName = `album_cover_${Date.now()}.${coverFile.name?.split('.').pop() || 'png'}`
      const coverUploadResult = await cosUploadService.uploadFile({
        file: coverFile,
        fileName: coverFileName,
        folder: 'albums',
      })

      if (!coverUploadResult.success || !coverUploadResult.url) {
        throw new Error(`上传封面图失败: ${coverUploadResult.error}`)
      }

      // 更新预览数据中的URL
      setUploadedUrls({
        album_image: coverUploadResult.url,
        result_image: coverUploadResult.url,
      })
      updatePreview()

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
        album_image: coverUploadResult.url,
        result_image: coverUploadResult.url, // 封面图同时作为result_image
        src_image: srcUploadResult.url,
        theme_styles: formValues.theme_styles || [],
        function_type: formValues.function_type,
        activity_tags: formValues.activity_tags || [],
        task_execution_type: formValues.task_execution_type || 'sync',
        level: formValues.level || AlbumLevel.FREE,
        price: formValues.price || 0,
        prompt_text: formValues.prompt_text,
        style_description: formValues.prompt_text,
        likes: 0,
        sort_weight: formValues.sort_weight || 0,
        published: false, // 未发布状态
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
    } catch (error: any) {
      console.error('上传或保存失败:', error)
      message.error(error.message || '上传或保存失败')
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
        <Header user={{ name: '管理员', avatarUrl: '' }} title="批量生图" />
        <main className="p-6 mt-16">
          <Row gutter={[24, 24]}>
            {/* 左侧表单 */}
            <Col xs={24} lg={16}>
              <Card title="批量生图" style={{ marginBottom: 24 }}>
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
                    task_execution_type: 'sync',
                  }}
                >
                  {/* 1. 选择功能类型 */}
                  <Form.Item 
                    name="function_type" 
                    label="功能类型" 
                    rules={[{ required: true, message: '请选择功能类型' }]}
                  >
                    <Select placeholder="选择功能类型" style={{ width: '100%' }}>
                      {categoryOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* 任务执行类型 */}
                  <Form.Item 
                    name="task_execution_type" 
                    label="任务执行类型" 
                    rules={[{ required: true, message: '请选择任务执行类型' }]}
                    tooltip="sync: 同步执行（立即返回结果，调用fusion接口）; async: 异步执行（需要轮询获取结果，调用callBailian接口）"
                  >
                    <Select placeholder="选择任务执行类型" style={{ width: '100%' }}>
                      <Option value="sync">同步执行（sync）</Option>
                      <Option value="async">异步执行（async）</Option>
                    </Select>
                  </Form.Item>

                  <Divider />

                  {/* 相册名称 */}
                  <Form.Item 
                    name="album_name" 
                    label="相册名称" 
                    rules={[{ required: true, message: '请填入相册名称' }]}
                  >
                    <Input placeholder="输入相册名称" />
                  </Form.Item>

                  {/* 相册描述 */}
                  <Form.Item 
                    name="album_description" 
                    label="相册描述" 
                    rules={[{ required: true, message: '请填入相册描述' }]}
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="输入相册描述"
                      style={{ maxWidth: '800px', width: '100%' }}
                    />
                  </Form.Item>

                  <Divider />

                  {/* 2. 本地上传封面图 */}
                  <Form.Item label="封面图（album_image / result_image）" required>
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false} // 阻止自动上传
                      onChange={handleCoverImageChange}
                      accept="image/*"
                    >
                      {coverImagePreview ? (
                        <Image
                          src={coverImagePreview}
                          alt="封面图预览"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preview={false}
                        />
                      ) : (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>上传封面图</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  {/* 3. 本地上传原始图 */}
                  <Form.Item label="原始图（src_image）" required>
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false} // 阻止自动上传
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

                  <Divider />

                  {/* 4. 填入 promptText */}
                  <Form.Item 
                    name="prompt_text" 
                    label="Prompt文本" 
                    rules={[{ required: true, message: '请填入Prompt文本' }]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="输入Prompt文本"
                      style={{ maxWidth: '800px', width: '100%' }}
                    />
                  </Form.Item>

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

                  {/* 其他配置 */}
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="level" label="相册等级">
                        <Select>
                          <Option value={AlbumLevel.FREE}>免费</Option>
                          <Option value={AlbumLevel.PREMIUM}>高级</Option>
                          <Option value={AlbumLevel.VIP}>VIP</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="price" label="价格（美美币）">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
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
