import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Form,
  Button,
  message,
  Row,
  Col,
  Image,
  Divider,
  Input,
  Upload,
  Steps,
  Spin,
  Alert,
  Space,
  Tag,
  Typography,
  Select,
  InputNumber,
  Switch,
} from 'antd'
import { 
  UploadOutlined, 
  CheckOutlined, 
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import axios from 'axios'
import { cosUploadService } from '../services/cosUpload'
import { albumService } from '../services/albumService'
import { categoryService } from '../services/categoryService'
import { workflowService, type WorkflowNodeData } from '../services/workflowService'
import { AlbumLevel } from '../types/album'
import type { AlbumRecord } from '../types/album'
import type { CategoryConfigRecord } from '../types/category'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useNavigate, useLocation } from 'react-router-dom'

const { TextArea } = Input
const { Title, Paragraph } = Typography
const { Option } = Select

// 每个目标图对应的相册数据（数组结构，每个元素对应一个目标图）
interface AlbumItemData {
  targetImageIndex: number // 目标图索引
  generatedPrompt?: string // 节点2：生成的提示词
  structuredPrompt?: string // 节点2：转译后的结构化提示词
  generatedCover?: string // 节点3：生成的封面图URL
  albumData?: { // 节点4：生成的相册数据
    album_name: string
    album_description: string
    prompt_text: string
    style_description?: string
    theme_styles?: string[]
    activity_tags?: string[]
  }
}

// 独立的表单组件，避免在 map 中使用 hooks
interface AlbumFormProps {
  item: AlbumItemData
  index: number
  categories: CategoryConfigRecord[]
  targetImageFiles: UploadFile[]
  srcImageFile: UploadFile | null
  onFormChange?: (index: number, form: any) => void
  onRegenerateCover?: (index: number, prompt: string) => Promise<void>
}

const AlbumFormItem: React.FC<AlbumFormProps> = ({ item, index, categories, targetImageFiles, srcImageFile, onFormChange, onRegenerateCover }) => {
  const [form] = Form.useForm()
  const [regenerating, setRegenerating] = useState(false)
  
  useEffect(() => {
    if (item.albumData) {
      form.setFieldsValue({
        album_name: item.albumData.album_name,
        album_description: item.albumData.album_description,
        prompt_text: item.albumData.prompt_text,
        theme_styles: item.albumData.theme_styles || [],
        activity_tags: item.albumData.activity_tags || [],
        level: AlbumLevel.FREE,
        price: 0,
        sort_weight: 0,
        function_type: categories.find(c => c.category_type === 'function_type' && c.is_active)?.category_code || 'portrait',
        task_execution_type: 'async_doubao_image_to_image',
      })
    }
  }, [item.albumData, form, categories])

  // 通知父组件表单实例已创建
  useEffect(() => {
    if (onFormChange) {
      onFormChange(index, form)
    }
  }, [form, index, onFormChange])

  // 监听表单值变化，更新JSON预览
  Form.useWatch([], form)

  // 获取srcImage预览URL
  const getSrcImagePreview = () => {
    if (!srcImageFile) return null
    const fileObj = srcImageFile.originFileObj || srcImageFile
    if (fileObj instanceof File) {
      return URL.createObjectURL(fileObj)
    }
    return null
  }

  // 使用Form.useWatch监听表单值变化，实时更新JSON预览
  const formValues = Form.useWatch([], form) || {}
  
  // 获取JSON预览数据（实时更新）
  const jsonPreview = {
    ...item.albumData,
    ...formValues,
  }

  return (
    <Card 
      title={`相册 ${index + 1}（目标图 ${index + 1}）`}
      style={{ marginBottom: 24 }}
    >
      <Row gutter={24}>
        {/* 左侧：表单 */}
        <Col span={14}>
          <Form 
            form={form}
            layout="vertical"
            initialValues={{
              level: AlbumLevel.FREE,
              price: 0,
              sort_weight: 0,
              theme_styles: [],
              activity_tags: [],
              task_execution_type: 'async_doubao_image_to_image',
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="function_type" 
                  label="功能类型"
                  rules={[{ required: true, message: '请选择功能类型' }]}
                >
                  <Select placeholder="选择功能类型">
                    {categories
                      .filter(c => c.category_type === 'function_type' && c.is_active)
                      .map(c => (
                        <Option key={c.category_code} value={c.category_code}>
                          {c.category_label_zh || c.category_label}
                        </Option>
                      ))}
                  </Select>
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
              name="task_execution_type" 
              label="选择模型" 
              rules={[{ required: true, message: '请选择模型' }]}
              tooltip="选择模型，决定调用哪个云函数以及需要填写哪些参数"
            >
              <Select placeholder="选择模型">
                <Option value="async_image_to_image">异步执行 - 图生图（调用 callBailian）</Option>
                <Option value="async_image_to_video">异步执行 - 图生视频（调用 callBailian）</Option>
                <Option value="async_video_effect">异步执行 - 视频特效（调用 callBailian）</Option>
                <Option value="async_portrait_style_redraw">异步执行 - 人像风格重绘（调用 callBailian）</Option>
                <Option value="async_doubao_image_to_image">异步执行 - 豆包图生图（调用 callBailian）</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              name="album_name" 
              label="相册名称"
              rules={[{ required: true, message: '请填入相册名称' }]}
            >
              <Input placeholder="输入相册名称" />
            </Form.Item>

            <Form.Item 
              name="album_description" 
              label="相册描述"
              rules={[{ required: true, message: '请填入相册描述' }]}
            >
              <TextArea rows={2} placeholder="输入相册描述" />
            </Form.Item>

            <Form.Item 
              name="prompt_text" 
              label="Prompt"
              rules={[{ required: true, message: '请填入Prompt' }]}
              extra={
                <Button
                  type="link"
                  size="small"
                  loading={regenerating}
                  onClick={async () => {
                    const prompt = form.getFieldValue('prompt_text')
                    if (!prompt) {
                      message.warning('请先填写Prompt')
                      return
                    }
                    if (!srcImageFile) {
                      message.warning('srcImage未设置')
                      return
                    }
                    if (onRegenerateCover) {
                      setRegenerating(true)
                      try {
                        await onRegenerateCover(index, prompt)
                        message.success('封面图重新生成成功')
                      } catch (error) {
                        message.error('重新生成封面图失败')
                      } finally {
                        setRegenerating(false)
                      }
                    }
                  }}
                >
                  重新生成封面图
                </Button>
              }
            >
              <TextArea rows={4} placeholder="输入Prompt" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="price" label="价格">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sort_weight" label="排序权重">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item 
              name="theme_styles" 
              label="主题风格"
            >
              <Select mode="multiple" placeholder="选择主题风格">
                {categories
                  .filter(c => c.category_type === 'theme_style' && c.is_active)
                  .map(c => (
                    <Option key={c.category_code} value={c.category_code}>
                      {c.category_label_zh || c.category_label}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="activity_tags" 
              label="活动标签"
            >
              <Select mode="multiple" placeholder="选择活动标签">
                {categories
                  .filter(c => c.category_type === 'activity_tag' && c.is_active)
                  .map(c => (
                    <Option key={c.category_code} value={c.category_code}>
                      {c.category_label_zh || c.category_label}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Form>
        </Col>

        {/* 右侧：图片预览和JSON */}
        <Col span={10}>
          <Row gutter={[0, 16]}>
            {/* 封面图和src_image */}
            <Col span={24}>
              <Card title="封面图" size="small">
                {item.generatedCover ? (
                  <Image
                    src={item.generatedCover}
                    width="100%"
                    style={{ maxHeight: 200, objectFit: 'contain' }}
                    preview
                  />
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                    未生成封面图
                  </div>
                )}
              </Card>
            </Col>
            <Col span={24}>
              <Card title="src_image" size="small">
                {srcImageFile ? (
                  <Image
                    src={getSrcImagePreview() || ''}
                    width="100%"
                    style={{ maxHeight: 200, objectFit: 'contain' }}
                    preview
                  />
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                    未选择src_image
                  </div>
                )}
              </Card>
            </Col>
            {/* JSON预览 */}
            <Col span={24}>
              <Card title="JSON预览" size="small">
                <TextArea 
                  value={JSON.stringify(jsonPreview, null, 2)} 
                  rows={12} 
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}

// 工作流步骤
enum WorkflowStep {
  INPUT = 0,           // 节点1：输入目标图和srcImage
  GENERATE_AND_TRANSLATE_PROMPT = 1, // 节点2：生成并转译提示词（合并）
  GENERATE_COVER = 2,  // 节点3：生成封面图
  GENERATE_DATA = 3,   // 节点4：生成相册数据
  PREVIEW = 4,         // 预览和确认
}

export default function WorkflowPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('workflow')

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
  
  // 工作流状态
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.INPUT)
  const [workflowData, setWorkflowData] = useState<WorkflowNodeData>({})
  const [processing, setProcessing] = useState(false)

  // 节点1：输入数据（只保存文件对象，不上传）
  const [targetImageFiles, setTargetImageFiles] = useState<UploadFile[]>([])
  const [srcImageFile, setSrcImageFile] = useState<UploadFile | null>(null)
  const [albumItems, setAlbumItems] = useState<AlbumItemData[]>([])
  const formRefs = useRef<Map<number, any>>(new Map())

  // 获取Category配置
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategoryConfig()
      setCategories(response.data || [])
    } catch (error: unknown) {
      console.error('获取Category配置失败:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 处理目标图选择（不上传，只保存文件对象）
  const handleTargetImagesChange = (info: any) => {
    const { fileList } = info
    const validFiles = fileList.filter((file: UploadFile) => file.status !== 'removed')
    setTargetImageFiles(validFiles)
  }

  // 处理srcImage选择（不上传，只保存文件对象）
  const handleSrcImageChange = (info: any) => {
    const { file } = info
    if (file.status === 'removed' || !file) {
      setSrcImageFile(null)
      return
    }

    const fileObj = file.originFileObj || file
    if (fileObj instanceof File) {
      setSrcImageFile(file as UploadFile)
    }
  }

  // 将文件转换为Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 节点2：生成并转译提示词（合并为一步，自动执行）
  const handleGenerateAndTranslatePrompts = async () => {
    if (targetImageFiles.length === 0) {
      message.warning('请先选择目标图')
      return
    }

    if (!srcImageFile) {
      message.warning('请先选择srcImage')
      return
    }

    try {
      setProcessing(true)

      // 获取DashScope API Key
      const dashscopeApiKey = process.env.REACT_APP_DASHSCOPE_API_KEY || ''
      if (!dashscopeApiKey) {
        message.error('DASHSCOPE_API_KEY 未配置，请在 .env 文件中设置 REACT_APP_DASHSCOPE_API_KEY')
        return
      }

      // 将srcImage转换为Base64
      const srcFileObj = srcImageFile.originFileObj || srcImageFile
      if (!(srcFileObj instanceof File)) {
        message.error('srcImage文件格式错误')
        return
      }
      const srcImageBase64 = await fileToBase64(srcFileObj)

      // 为每个目标图生成并转译提示词
      const newAlbumItems: AlbumItemData[] = []

      for (let index = 0; index < targetImageFiles.length; index++) {
        const file = targetImageFiles[index]
        const fileObj = file.originFileObj || file
        if (!(fileObj instanceof File)) continue

        // 转换为Base64
        const imageBase64 = await fileToBase64(fileObj)

        // 步骤1：生成提示词
        const generateContent = [
          {
            type: 'image_url',
            image_url: { url: imageBase64 }
          },
          {
            type: 'image_url',
            image_url: { url: srcImageBase64 }
          },
          {
            type: 'text',
            text: '请用简洁的一段话描述第一张图片（目标风格图）的画面风格、场景和主要元素。第二张图片是人物自拍图，仅作为参考，不需要描述。'
          }
        ]

        const generateResponse = await axios.post(
          'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          {
            model: 'qwen-vl-max',
            messages: [{ role: 'user', content: generateContent }],
            temperature: 0.7,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${dashscopeApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        )

        console.log(`[节点2] 第${index + 1}张图生成提示词响应:`, generateResponse.data)
        
        if (!generateResponse.data?.choices?.[0]?.message?.content) {
          console.error(`[节点2] 第${index + 1}张图生成提示词失败，响应:`, generateResponse.data)
          throw new Error(`第${index + 1}张图生成提示词失败：响应格式异常`)
        }

        const generatedPrompt = generateResponse.data.choices[0].message.content.trim()
        console.log(`[节点2] 第${index + 1}张图生成的提示词:`, generatedPrompt)

        // 步骤2：转译提示词
        const systemPrompt = `你是一个提示词转译专家。你的任务是将用户提供的提示词转译为结构化提示词，用于图生图任务。

转译规则：
1. 将提示词中关于人物的描述（如"一个人"、"女性"、"男性"、"人物"等）改为"图中的人物xxx"，其中xxx保留原描述的特征
2. 保留所有关于画面风格、构图、色彩、背景、场景等非人物相关的描述
3. 确保转译后的提示词完整、准确，能够用于图生图任务
4. 如果原提示词中没有人物描述，则保持原样

请直接返回转译后的提示词，不要添加任何解释或说明。`

        const translateResponse = await axios.post(
          'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          {
            model: 'qwen-plus',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请转译以下提示词：\n\n${generatedPrompt}` }
            ],
            temperature: 0.3,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${dashscopeApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        )

        console.log(`[节点2] 第${index + 1}张图转译提示词响应:`, translateResponse.data)
        
        if (!translateResponse.data?.choices?.[0]?.message?.content) {
          console.error(`[节点2] 第${index + 1}张图转译提示词失败，响应:`, translateResponse.data)
          throw new Error(`第${index + 1}张图转译提示词失败：响应格式异常`)
        }

        const structuredPrompt = translateResponse.data.choices[0].message.content.trim()
        console.log(`[节点2] 第${index + 1}张图转译后的提示词:`, structuredPrompt)

        newAlbumItems.push({
          targetImageIndex: index,
          generatedPrompt,
          structuredPrompt,
        })
        
        console.log(`[节点2] 第${index + 1}张图数据已保存到albumItems`)
      }

      console.log(`[节点2] 所有相册项处理完成，准备更新状态。newAlbumItems:`, newAlbumItems.map(item => ({
        targetImageIndex: item.targetImageIndex,
        generatedPrompt: item.generatedPrompt?.substring(0, 30) + '...',
        structuredPrompt: item.structuredPrompt?.substring(0, 30) + '...'
      })))
      
      setAlbumItems(newAlbumItems)

      // 保持向后兼容
      const prompts = newAlbumItems.map(item => item.generatedPrompt || '')
      const structuredPrompts = newAlbumItems.map(item => item.structuredPrompt || '')
      setWorkflowData(prev => ({
        ...prev,
        targetImageFiles: targetImageFiles,
        srcImageFile: srcImageFile,
        generatedPrompts: prompts,
        structuredPrompts,
        finalPrompt: structuredPrompts[0] || '',
      }))

      message.success(`成功生成并转译 ${newAlbumItems.length} 个提示词`)
      
      // 自动进入下一步：生成封面图
      setCurrentStep(WorkflowStep.GENERATE_COVER)
      
      // 使用useEffect或者直接传递数据，避免状态更新延迟问题
      // 自动执行生成封面图（传递newAlbumItems而不是依赖状态）
      setTimeout(() => {
        // 直接使用newAlbumItems，不依赖状态
        handleGenerateCoverWithItems(newAlbumItems)
      }, 500)
    } catch (error: unknown) {
      console.error('转译提示词失败:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } }
        const errorMessage = axiosError.response?.data?.error?.message || '转译提示词失败'
        message.error(errorMessage)
      } else {
        const errorMessage = error instanceof Error ? error.message : '转译提示词失败'
        message.error(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }

  // 节点4：生成封面图（直接调用豆包API，使用Base64，无需上传到COS）
  const handleGenerateCover = async () => {
    return handleGenerateCoverWithItems(albumItems)
  }

  // 重新生成单个相册项的封面图（用于预览页面的重新生成功能）
  const handleRegenerateSingleCover = async (index: number, prompt: string) => {
    if (!srcImageFile) {
      throw new Error('srcImage未设置')
    }

    // 获取豆包 API Key
    const doubaoApiKey = process.env.REACT_APP_DOUBAO_API_KEY || process.env.REACT_APP_ARK_API_KEY || ''
    if (!doubaoApiKey) {
      throw new Error('REACT_APP_DOUBAO_API_KEY 或 REACT_APP_ARK_API_KEY 未配置')
    }

    // 将srcImage转换为Base64
    const srcFileObj = srcImageFile.originFileObj || srcImageFile
    if (!(srcFileObj instanceof File)) {
      throw new Error('srcImage文件格式错误')
    }

    // 转换为Base64 Data URL
    const srcImageBase64 = await fileToBase64(srcFileObj)

    // 调用豆包API生成封面图
    const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
    
    console.log(`[重新生成封面图] 相册项${index + 1}，prompt:`, prompt.substring(0, 50) + '...')
    
    const response = await axios.post(
      apiUrl,
      {
        model: 'doubao-seedream-4-5-251128',
        prompt: prompt,
        image: srcImageBase64, // Base64 Data URL
        response_format: 'url',
        size: '2k',
        stream: false,
        watermark: false,
        sequential_image_generation: 'disabled'
      },
      {
        headers: {
          'Authorization': `Bearer ${doubaoApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2分钟超时
      }
    )

    console.log(`[重新生成封面图] 相册项${index + 1} API响应:`, JSON.stringify(response.data, null, 2))

    // 火山方舟豆包API返回格式：{ data: [{ url: '...', size: '...', model: '...' }] }
    if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      const coverUrl = response.data.data[0].url
      
      if (coverUrl) {
        console.log(`[重新生成封面图] 相册项${index + 1} 生成成功:`, coverUrl)
        
        // 更新对应相册项的generatedCover
        setAlbumItems(prev => {
          const updated = [...prev]
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              generatedCover: coverUrl
            }
          }
          return updated
        })
        
        return coverUrl
      } else {
        throw new Error(`封面图生成失败：响应中url字段为空。响应数据: ${JSON.stringify(response.data.data[0])}`)
      }
    } else {
      throw new Error(`封面图生成失败：API返回数据格式异常。响应数据: ${JSON.stringify(response.data)}`)
    }
  }

  // 生成封面图（接受items参数，避免状态更新延迟问题）
  const handleGenerateCoverWithItems = async (items: AlbumItemData[]) => {
    if (items.length === 0 || items.some(item => !item.structuredPrompt)) {
      console.error('[节点3] 检查失败，items:', items.map(item => ({
        hasStructuredPrompt: !!item.structuredPrompt,
        structuredPrompt: item.structuredPrompt
      })))
      message.warning('请先完成节点2：生成并转译提示词')
      setProcessing(false)
      return
    }

    if (!srcImageFile) {
      message.warning('srcImage未设置')
      setProcessing(false)
      return
    }

    try {
      setProcessing(true)

      // 获取豆包 API Key
      const doubaoApiKey = process.env.REACT_APP_DOUBAO_API_KEY || process.env.REACT_APP_ARK_API_KEY || ''
      if (!doubaoApiKey) {
        message.error('REACT_APP_DOUBAO_API_KEY 或 REACT_APP_ARK_API_KEY 未配置')
        setProcessing(false)
        return
      }

      // 将srcImage转换为Base64
      const srcFileObj = srcImageFile.originFileObj || srcImageFile
      if (!(srcFileObj instanceof File)) {
        message.error('srcImage文件格式错误')
        setProcessing(false)
        return
      }

      // 转换为Base64 Data URL
      const srcImageBase64 = await fileToBase64(srcFileObj)

      // 为每个相册项生成封面图
      const updatedAlbumItems = [...items]
      const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'

      console.log(`[节点3] 开始生成封面图，albumItems数量: ${updatedAlbumItems.length}`)
      console.log(`[节点3] albumItems数据:`, updatedAlbumItems.map(item => ({
        targetImageIndex: item.targetImageIndex,
        hasGeneratedPrompt: !!item.generatedPrompt,
        hasStructuredPrompt: !!item.structuredPrompt,
        structuredPrompt: item.structuredPrompt?.substring(0, 50) + '...'
      })))

      for (let i = 0; i < updatedAlbumItems.length; i++) {
        const item = updatedAlbumItems[i]
        console.log(`[节点3] 处理第${i + 1}个相册项，structuredPrompt:`, item.structuredPrompt)
        
        if (!item.structuredPrompt) {
          console.warn(`[节点3] 第${i + 1}个相册项没有structuredPrompt，跳过`)
          continue
        }

        // 直接调用火山方舟豆包API
        console.log(`[节点3] 开始生成第${i + 1}张封面图，prompt: ${item.structuredPrompt?.substring(0, 50)}...`)
        
        const response = await axios.post(
          apiUrl,
          {
            model: 'doubao-seedream-4-5-251128',
            prompt: item.structuredPrompt,
            image: srcImageBase64, // Base64 Data URL
            response_format: 'url',
            size: '2k',
            stream: false,
            watermark: false,
            sequential_image_generation: 'disabled'
          },
          {
            headers: {
              'Authorization': `Bearer ${doubaoApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000 // 2分钟超时
          }
        )

        console.log(`[节点3] 第${i + 1}张封面图API响应:`, JSON.stringify(response.data, null, 2))

        // 火山方舟豆包API返回格式：{ data: [{ url: '...', size: '...', model: '...' }] }
        if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const coverUrl = response.data.data[0].url
          
          if (coverUrl) {
            console.log(`[节点3] 第${i + 1}张封面图生成成功:`, coverUrl)
            updatedAlbumItems[i].generatedCover = coverUrl
          } else {
            console.error(`[节点3] 第${i + 1}张封面图响应中url为空:`, response.data.data[0])
            throw new Error(`第${i + 1}张封面图生成失败：响应中url字段为空。响应数据: ${JSON.stringify(response.data.data[0])}`)
          }
        } else {
          console.error(`[节点3] 第${i + 1}张封面图响应格式异常:`, JSON.stringify(response.data, null, 2))
          throw new Error(`第${i + 1}张封面图生成失败：API返回数据格式异常。响应数据: ${JSON.stringify(response.data)}`)
        }
      }

      console.log(`[节点3] 所有封面图生成完成，准备更新状态。updatedAlbumItems:`, updatedAlbumItems.map(item => ({
        targetImageIndex: item.targetImageIndex,
        hasStructuredPrompt: !!item.structuredPrompt,
        hasGeneratedCover: !!item.generatedCover,
        generatedCover: item.generatedCover?.substring(0, 50) + '...'
      })))
      
      setAlbumItems(updatedAlbumItems)

      // 保持向后兼容
      const firstCover = updatedAlbumItems[0]?.generatedCover
      setWorkflowData(prev => ({
        ...prev,
        generatedAlbumCover: firstCover,
      }))

      message.success(`成功生成 ${updatedAlbumItems.length} 张封面图`)
      
      // 自动进入下一步：生成相册数据
      setCurrentStep(WorkflowStep.GENERATE_DATA)
      
      // 自动执行生成相册数据（传递updatedAlbumItems，避免状态更新延迟问题）
      setTimeout(() => {
        console.log(`[节点3] 准备调用节点4，传递的updatedAlbumItems:`, updatedAlbumItems)
        handleGenerateAlbumDataWithItems(updatedAlbumItems)
      }, 500)
    } catch (error: unknown) {
      console.error('生成封面图失败:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        const errorMessage = axiosError.response?.data?.message || '生成封面图失败'
        message.error(errorMessage)
      } else {
        const errorMessage = error instanceof Error ? error.message : '生成封面图失败'
        message.error(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }

  // 节点5：生成相册数据（直接调用通义千问API）
  const handleGenerateAlbumData = async () => {
    return handleGenerateAlbumDataWithItems(albumItems)
  }

  // 生成相册数据（接受items参数，避免状态更新延迟问题）
  const handleGenerateAlbumDataWithItems = async (items: AlbumItemData[]) => {
    console.log(`[节点4] 开始生成相册数据，items数量: ${items.length}`)
    console.log(`[节点4] items数据:`, items.map(item => ({
      targetImageIndex: item.targetImageIndex,
      hasStructuredPrompt: !!item.structuredPrompt,
      hasGeneratedCover: !!item.generatedCover,
      structuredPrompt: item.structuredPrompt?.substring(0, 50) + '...',
      generatedCover: item.generatedCover?.substring(0, 50) + '...'
    })))

    if (items.length === 0 || items.some(item => !item.structuredPrompt || !item.generatedCover)) {
      console.error('[节点4] 检查失败，items:', items.map(item => ({
        hasStructuredPrompt: !!item.structuredPrompt,
        hasGeneratedCover: !!item.generatedCover,
        structuredPrompt: item.structuredPrompt,
        generatedCover: item.generatedCover
      })))
      message.warning('请先完成前面的节点')
      setProcessing(false)
      return
    }

    try {
      setProcessing(true)

      // 获取DashScope API Key
      const dashscopeApiKey = process.env.REACT_APP_DASHSCOPE_API_KEY || ''
      if (!dashscopeApiKey) {
        message.error('DASHSCOPE_API_KEY 未配置')
        setProcessing(false)
        return
      }

      // 构建系统提示词
      const systemPrompt = `你是一个相册数据生成专家。你的任务是根据用户提供的信息，生成相册的名称、描述等数据。

生成规则：
1. 相册名称：简洁、吸引人，能够体现相册的风格和主题，长度控制在10-20字
2. 相册描述：详细描述相册的特点、风格、适用场景等，长度控制在50-100字
3. 主题风格：根据提示词和图片内容，提取2-4个主题风格标签（如：日系、清新、复古、时尚等）
4. 活动标签：根据相册特点，提取1-2个活动标签（如：new、free等，可选）

请以JSON格式返回，格式如下：
{
  "album_name": "相册名称",
  "album_description": "相册描述",
  "theme_styles": ["风格1", "风格2"],
  "activity_tags": ["标签1"]
}`

      // 为每个相册项生成数据
      const updatedAlbumItems = [...items]

      for (let i = 0; i < updatedAlbumItems.length; i++) {
        const item = updatedAlbumItems[i]
        console.log(`[节点4] 处理第${i + 1}个相册项，structuredPrompt:`, item.structuredPrompt, 'generatedCover:', item.generatedCover)
        
        if (!item.structuredPrompt || !item.generatedCover) {
          console.warn(`[节点4] 第${i + 1}个相册项数据不完整，跳过`)
          continue
        }

        // 构建用户提示词
        let userPrompt = `请根据以下信息生成相册数据：\n\n`
        userPrompt += `最终使用的Prompt：${item.structuredPrompt}\n\n`
        
        if (item.generatedPrompt) {
          userPrompt += `原始提示词：${item.generatedPrompt}\n\n`
        }

        userPrompt += `已生成封面图\n`

        // 直接调用通义千问API
        const response = await axios.post(
          'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          {
            model: 'qwen-plus',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${dashscopeApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        )

        console.log(`[节点4] 第${i + 1}个相册项API响应:`, response.data)
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content.trim()
          console.log(`[节点4] 第${i + 1}个相册项API返回的content:`, content)
          
          // 尝试解析JSON
          let albumData
          try {
            // 尝试提取JSON部分（如果返回的内容包含其他文本）
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              albumData = JSON.parse(jsonMatch[0])
            } else {
              albumData = JSON.parse(content)
            }
            console.log(`[节点4] 第${i + 1}个相册项解析后的albumData:`, albumData)
          } catch (parseError) {
            // 如果解析失败，使用默认值
            console.warn(`[节点4] 第${i + 1}个相册项JSON解析失败，使用默认值:`, parseError, '原始content:', content)
            albumData = {
              album_name: 'AI生成相册',
              album_description: item.structuredPrompt.substring(0, 100),
              theme_styles: [],
              activity_tags: []
            }
          }

          // 确保返回的数据包含prompt_text
          updatedAlbumItems[i].albumData = {
            album_name: albumData.album_name || 'AI生成相册',
            album_description: albumData.album_description || item.structuredPrompt.substring(0, 100),
            prompt_text: item.structuredPrompt,
            style_description: albumData.album_description || item.structuredPrompt.substring(0, 100),
            theme_styles: albumData.theme_styles || [],
            activity_tags: albumData.activity_tags || []
          }
          
          console.log(`[节点4] 第${i + 1}个相册项数据已保存:`, updatedAlbumItems[i].albumData)
        } else {
          console.error(`[节点4] 第${i + 1}个相册项API返回数据格式异常:`, response.data)
          throw new Error(`第${i + 1}条相册数据生成失败：API返回数据格式异常`)
        }
      }

      setAlbumItems(updatedAlbumItems)

      // 保持向后兼容
      const firstAlbumData = updatedAlbumItems[0]?.albumData
      setWorkflowData(prev => ({
        ...prev,
        albumData: firstAlbumData,
      }))

      message.success(`成功生成 ${updatedAlbumItems.length} 条相册数据`)
      
      // 自动进入预览页面（最后一个节点，需要用户确认）
      setCurrentStep(WorkflowStep.PREVIEW)
    } catch (error: unknown) {
      console.error('生成相册数据失败:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } }
        const errorMessage = axiosError.response?.data?.error?.message || '生成相册数据失败'
        message.error(errorMessage)
      } else {
        const errorMessage = error instanceof Error ? error.message : '生成相册数据失败'
        message.error(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }

  // 应用并保存（此时才上传图片并保存到数据库，为每个相册数据分别创建）
  const handleApply = async () => {
    if (albumItems.length === 0 || albumItems.some(item => !item.albumData)) {
      message.warning('相册数据未生成')
      return
    }

    if (!srcImageFile) {
      message.warning('请先选择srcImage')
      return
    }

    try {
      setProcessing(true)

      // 1. 上传srcImage到COS（最终保存，所有相册共享同一个srcImage）
      const srcFileObj = srcImageFile.originFileObj || srcImageFile
      if (!(srcFileObj instanceof File)) {
        message.error('srcImage文件格式错误')
        return
      }

      const srcFileName = `src_${Date.now()}.${srcFileObj.name?.split('.').pop() || 'png'}`
      const srcUploadResult = await cosUploadService.uploadFile({
        file: srcFileObj,
        fileName: srcFileName,
        folder: 'albums',
      })

      if (!srcUploadResult.success || !srcUploadResult.url) {
        throw new Error(`上传srcImage失败: ${srcUploadResult.error}`)
      }

      // 2. 为每个相册数据分别创建记录
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < albumItems.length; i++) {
        const item = albumItems[i]
        if (!item.albumData) continue

        try {
          // 获取封面图（使用生成的封面图，如果没有则使用对应的目标图）
          let albumImage = item.generatedCover
          
          if (!albumImage && targetImageFiles[i]) {
            // 上传对应的目标图作为封面
            const targetFile = targetImageFiles[i]
            const targetFileObj = targetFile.originFileObj || targetFile
            if (targetFileObj instanceof File) {
              const coverFileName = `album_cover_${Date.now()}_${i}.${targetFileObj.name?.split('.').pop() || 'png'}`
              const coverUploadResult = await cosUploadService.uploadFile({
                file: targetFileObj,
                fileName: coverFileName,
                folder: 'albums',
              })

              if (coverUploadResult.success && coverUploadResult.url) {
                albumImage = coverUploadResult.url
              }
            }
          }

          if (!albumImage) {
            throw new Error(`第${i + 1}条相册数据：无法获取封面图`)
          }

          // 3. 构建Album数据并保存到数据库
          // 从表单获取最新值（如果表单存在）
          const formInstance = formRefs.current.get(i)
          const formValues = formInstance ? formInstance.getFieldsValue() : {}
          
          const albumData: Omit<AlbumRecord, 'album_id' | 'created_at' | 'updated_at'> = {
            album_name: formValues.album_name || item.albumData.album_name,
            album_description: formValues.album_description || item.albumData.album_description,
            album_image: albumImage,
            result_image: albumImage,
            src_image: srcUploadResult.url,
            theme_styles: formValues.theme_styles || item.albumData.theme_styles || [],
            function_type: formValues.function_type || categories.find(c => c.category_type === 'function_type' && c.is_active)?.category_code || 'portrait',
            activity_tags: formValues.activity_tags || item.albumData.activity_tags || [],
            task_execution_type: formValues.task_execution_type || 'async_doubao_image_to_image',
            level: AlbumLevel.FREE,
            price: 0,
            prompt_text: formValues.prompt_text || item.albumData.prompt_text,
            style_description: formValues.album_description || item.albumData.style_description || item.albumData.prompt_text,
            likes: 0,
            sort_weight: 0,
            published: false,
            exclude_result_image: false,
          }

          await albumService.createAlbum(albumData)
          successCount++
        } catch (error: unknown) {
          console.error(`创建第${i + 1}条相册数据失败:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        message.success(`成功创建 ${successCount} 条相册数据${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)
      } else {
        message.error('所有相册数据创建失败')
      }

      // 重置工作流
      setCurrentStep(WorkflowStep.INPUT)
      setWorkflowData({})
      setAlbumItems([])
      setTargetImageFiles([])
      setSrcImageFile(null)
    } catch (error: unknown) {
      console.error('保存相册失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存相册失败'
      message.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  // 步骤配置
  const steps = [
    {
      title: '输入数据',
      description: '上传目标图和srcImage',
      icon: <UploadOutlined />,
    },
    {
      title: '生成并转译提示词',
      description: '生成提示词并转译为结构化提示词',
      icon: <PlayCircleOutlined />,
    },
    {
      title: '生成封面图',
      description: '使用doubao img2img生成封面',
      icon: <PlayCircleOutlined />,
    },
    {
      title: '生成相册数据',
      description: '生成相册名称、描述等',
      icon: <PlayCircleOutlined />,
    },
    {
      title: '预览确认',
      description: '预览并确认提交',
      icon: <EyeOutlined />,
    },
  ]

  return (
    <div className="flex">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={{ name: '管理员', avatarUrl: '' }} title="相册创建工作流" />
        <main className="p-6 mt-16">
          <Card>
            <Title level={3}>相册创建工作流</Title>
            <Paragraph type="secondary">
              通过4个节点的工作流，自动生成相册数据。除最后一个预览节点外，其他节点会自动执行。
            </Paragraph>

            <Divider />

            {/* 步骤条 */}
            <Steps
              current={currentStep}
              items={steps}
              style={{ marginBottom: 40 }}
            />

            {/* 节点1：输入数据 */}
            {currentStep === WorkflowStep.INPUT && (
              <Card title="节点1：输入数据">
                <Alert
                  message="上传一张或多张目标风格图，以及srcImage（人物自拍）"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5}>目标风格图（可多张）</Title>
                      <Upload
                        listType="picture-card"
                        multiple
                        beforeUpload={() => false}
                        onChange={handleTargetImagesChange}
                        accept="image/*"
                        fileList={targetImageFiles}
                      >
                        {targetImageFiles.length < 10 && (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>上传目标图</div>
                          </div>
                        )}
                      </Upload>
                      {targetImageFiles.length > 0 && (
                        <div style={{ marginTop: 16, fontSize: 12, color: '#52c41a' }}>
                          <CheckCircleOutlined /> 已选择 {targetImageFiles.length} 张目标图
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 24 }}>
                      <Title level={5}>srcImage（人物自拍）</Title>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        onChange={handleSrcImageChange}
                        accept="image/*"
                        showUploadList={false}
                      >
                        {srcImageFile ? (
                          (() => {
                            const fileObj = srcImageFile.originFileObj || srcImageFile
                            if (fileObj instanceof File) {
                              const previewUrl = URL.createObjectURL(fileObj)
                              return (
                                <Image
                                  src={previewUrl}
                                  alt="srcImage"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  preview={false}
                                />
                              )
                            }
                            return null
                          })()
                        ) : (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>选择srcImage</div>
                          </div>
                        )}
                      </Upload>
                      {srcImageFile && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                          <CheckCircleOutlined /> srcImage已选择（将在确认提交时上传）
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    disabled={targetImageFiles.length === 0 || !srcImageFile}
                    onClick={async () => {
                      if (targetImageFiles.length === 0) {
                        message.warning('请选择至少一张目标图')
                        return
                      }
                      if (!srcImageFile) {
                        message.warning('请选择srcImage')
                        return
                      }
                      setCurrentStep(WorkflowStep.GENERATE_AND_TRANSLATE_PROMPT)
                      // 自动执行生成并转译提示词
                      setTimeout(() => {
                        handleGenerateAndTranslatePrompts()
                      }, 300)
                    }}
                  >
                    开始工作流（自动执行）
                  </Button>
                  {(targetImageFiles.length === 0 || !srcImageFile) && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      {targetImageFiles.length === 0 && '请选择至少一张目标图'}
                      {!srcImageFile && targetImageFiles.length > 0 && '请选择srcImage'}
                      {targetImageFiles.length === 0 && !srcImageFile && '请选择目标图和srcImage'}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 节点2：生成提示词 */}
            {currentStep === WorkflowStep.GENERATE_PROMPT && (
              <Card title="节点2：生成并转译提示词">
                <Alert
                  message="根据目标图生成提示词并转译为结构化提示词（自动执行）"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {albumItems.length > 0 && albumItems.some(item => item.generatedPrompt || item.structuredPrompt) ? (
                  <div>
                    <Title level={5}>生成的提示词和转译结果（每个目标图对应一个）：</Title>
                    {albumItems.map((item, index) => (
                      <Card key={index} size="small" style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>目标图 {index + 1}：</strong>
                          {targetImageFiles[index] && (
                            <Image
                              src={URL.createObjectURL((targetImageFiles[index].originFileObj || targetImageFiles[index]) as File)}
                              width={100}
                              style={{ marginLeft: 8 }}
                              preview={false}
                            />
                          )}
                        </div>
                        {item.generatedPrompt && (
                          <div style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ fontSize: 14 }}>生成的提示词：</Title>
                            <Paragraph copyable>{item.generatedPrompt}</Paragraph>
                          </div>
                        )}
                        {item.structuredPrompt && (
                          <div>
                            <Title level={5} style={{ fontSize: 14 }}>转译后的结构化提示词：</Title>
                            <Paragraph copyable style={{ color: '#1890ff' }}>{item.structuredPrompt}</Paragraph>
                          </div>
                        )}
                        {!item.generatedPrompt && !item.structuredPrompt && (
                          <Paragraph type="secondary">处理中...</Paragraph>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div>
                    <Spin tip="正在生成并转译提示词..." />
                  </div>
                )}

                {processing && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin size="large" tip="处理中，请稍候..." />
                  </div>
                )}
              </Card>
            )}

            {/* 节点3：生成封面图 */}
            {currentStep === WorkflowStep.GENERATE_COVER && (
              <Card title="节点3：生成封面图">
                <Alert
                  message="使用最终提示词 + srcImage，调用doubao img2img生成albumCover（自动执行）"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {albumItems.length > 0 && albumItems.some(item => item.generatedCover) ? (
                  <div>
                    <Title level={5}>生成的封面图（每个目标图对应一张）：</Title>
                    <Row gutter={16}>
                      {albumItems.map((item, index) => (
                        <Col key={index} span={8}>
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                              <strong>目标图 {index + 1}：</strong>
                            </div>
                            {item.generatedCover ? (
                              <Image
                                src={item.generatedCover}
                                width="100%"
                                preview
                              />
                            ) : (
                              <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                                生成中...
                              </div>
                            )}
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : (
                  <div>
                    <Spin tip="正在生成封面图..." />
                  </div>
                )}

                {processing && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin size="large" tip="处理中，请稍候..." />
                  </div>
                )}
              </Card>
            )}

            {/* 节点4：生成相册数据 */}
            {currentStep === WorkflowStep.GENERATE_DATA && (
              <Card title="节点4：生成相册数据">
                <Alert
                  message="基于前序节点数据，生成相册名称、描述等，并填入prompt（自动执行）"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {albumItems.length > 0 && albumItems.some(item => item.albumData) ? (
                  <div>
                    <Title level={5}>生成的相册数据（每个目标图对应一条）：</Title>
                    {albumItems.map((item, index) => (
                      <Card key={index} size="small" style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>目标图 {index + 1}：</strong>
                        </div>
                        {item.albumData ? (
                          <div>
                            <Paragraph>
                              <strong>相册名称：</strong>{item.albumData.album_name}
                            </Paragraph>
                            <Paragraph>
                              <strong>相册描述：</strong>{item.albumData.album_description}
                            </Paragraph>
                            <Paragraph>
                              <strong>Prompt：</strong>
                              <TextArea value={item.albumData.prompt_text} rows={3} readOnly />
                            </Paragraph>
                            {item.albumData.theme_styles && item.albumData.theme_styles.length > 0 && (
                              <Paragraph>
                                <strong>主题风格：</strong>
                                <Space>
                                  {item.albumData.theme_styles.map((style, i) => (
                                    <Tag key={i}>{style}</Tag>
                                  ))}
                                </Space>
                              </Paragraph>
                            )}
                            {item.albumData.activity_tags && item.albumData.activity_tags.length > 0 && (
                              <Paragraph>
                                <strong>活动标签：</strong>
                                <Space>
                                  {item.albumData.activity_tags.map((tag, i) => (
                                    <Tag key={i}>{tag}</Tag>
                                  ))}
                                </Space>
                              </Paragraph>
                            )}
                            <Paragraph>
                              <strong>JSON数据：</strong>
                              <TextArea 
                                value={JSON.stringify(item.albumData, null, 2)} 
                                rows={6} 
                                readOnly 
                              />
                            </Paragraph>
                          </div>
                        ) : (
                          <Paragraph type="secondary">生成中...</Paragraph>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div>
                    <Spin tip="正在生成相册数据..." />
                  </div>
                )}

                {processing && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin size="large" tip="处理中，请稍候..." />
                  </div>
                )}
              </Card>
            )}

            {/* 节点6：预览确认 */}
            {currentStep === WorkflowStep.PREVIEW && (
              <Card title="节点6：预览确认">
                <Alert
                  message="预览并编辑所有生成的数据，确认无误后点击APPLY提交（每个目标图对应一条相册数据）"
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {albumItems.length > 0 && albumItems.every(item => item.albumData) ? (
                  <div>
                    {albumItems.map((item, index) => (
                      <AlbumFormItem
                        key={index}
                        item={item}
                        index={index}
                        categories={categories}
                        targetImageFiles={targetImageFiles}
                        srcImageFile={srcImageFile}
                        onFormChange={(idx, form) => {
                          formRefs.current.set(idx, form)
                        }}
                        onRegenerateCover={handleRegenerateSingleCover}
                      />
                    ))}

                    <div style={{ marginTop: 24 }}>
                      <Space>
                        <Button onClick={() => setCurrentStep(WorkflowStep.GENERATE_DATA)}>
                          上一步
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          icon={<CheckOutlined />}
                          onClick={handleApply}
                          loading={processing}
                        >
                          APPLY - 确认提交所有相册
                        </Button>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Alert
                      message="请先完成前面的节点"
                      type="warning"
                      showIcon
                    />
                  </div>
                )}
              </Card>
            )}

            {processing && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" tip="处理中，请稍候..." />
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  )
}

