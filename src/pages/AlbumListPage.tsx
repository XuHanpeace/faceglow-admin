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
    setEditingAlbum({ ...album })
    setSrcImageFile(null)
    setSrcImagePreview('')
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
        function_type: editingAlbum.function_type,
        theme_styles: editingAlbum.theme_styles,
        activity_tags: editingAlbum.activity_tags,
        sort_weight: editingAlbum.sort_weight,
      }

      // 如果是图生图类型或个人写真类型，更新相关字段
      if (editingAlbum.function_type === FunctionType.IMAGE_TO_IMAGE || 
          editingAlbum.function_type === FunctionType.PORTRAIT) {
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
    if (type === 'sync') return '同步执行（sync）'
    if (type === 'async') return '异步执行（async）'
    return type || '未知'
  }

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
      render: (url: string) => (
        <img
          src={url}
          alt="封面"
          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
          onClick={() => setPreviewImage({ visible: true, url })}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/60'
          }}
        />
      ),
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
              <Input value={editingAlbum.album_name} disabled />
            </div>

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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>任务执行类型：</label>
              <Input 
                value={getTaskExecutionTypeLabel(editingAlbum.task_execution_type)} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>

            <Divider />

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

            {/* 图生图类型或个人写真类型的特殊字段 */}
            {(editingAlbum.function_type === FunctionType.IMAGE_TO_IMAGE || 
              editingAlbum.function_type === FunctionType.PORTRAIT) && (
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
          </div>
        )}
      </Modal>

      {/* 图片预览 Modal */}
      <Modal
        open={previewImage.visible}
        footer={null}
        onCancel={() => setPreviewImage({ visible: false, url: '' })}
        width={800}
        centered
        style={{ maxWidth: '90vw' }}
        bodyStyle={{ maxHeight: '90vh', overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
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
      </Modal>
        </main>
      </div>
    </div>
  )
}

