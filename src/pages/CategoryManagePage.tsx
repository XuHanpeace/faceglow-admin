import { useState, useEffect, useMemo } from 'react'
import { message, Modal, Input, Select, Switch, Button, Card, Tag, Space, Divider, Form, Checkbox } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { categoryService } from '../services/categoryService'
import type { CategoryConfigRecord } from '../types/category'
import { CategoryType } from '../types/category'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useNavigate, useLocation } from 'react-router-dom'
const { Option } = Select
const { TextArea } = Input

export default function CategoryManagePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('categories')

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
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryConfigRecord | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [showActiveOnly, setShowActiveOnly] = useState(true) // 默认只显示生效中的

  // 创建表单状态
  const [formData, setFormData] = useState({
    category_type: CategoryType.FUNCTION_TYPE,
    category_code: '',
    category_label: '',
    category_label_zh: '',
    icon: '',
    sort_order: 0,
    is_active: true,
    extra_config: {
      supported_theme_styles: [] as string[],
      is_featured: false,
    }
  })

  // 编辑表单状态
  const [editFormData, setEditFormData] = useState({
    category_label: '',
    category_label_zh: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  })

  // 获取所有分类
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getCategoryConfig()
      setCategories(response.data || [])
    } catch (error: any) {
      console.error('获取Category配置失败:', error)
      message.error(error.message || '获取Category配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 按类型分组并排序（sort_order 升序，值越小越靠前）
  const functionTypes = useMemo(() => {
    const filtered = categories.filter(c => c.category_type === CategoryType.FUNCTION_TYPE)
    if (showActiveOnly) {
      return filtered
        .filter(c => c.is_active === true)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
    return filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [categories, showActiveOnly])

  const themeStyles = useMemo(() => {
    const filtered = categories.filter(c => c.category_type === CategoryType.THEME_STYLE)
    if (showActiveOnly) {
      return filtered
        .filter(c => c.is_active === true)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
    return filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [categories, showActiveOnly])

  const activityTags = useMemo(() => {
    const filtered = categories.filter(c => c.category_type === CategoryType.ACTIVITY_TAG)
    if (showActiveOnly) {
      return filtered
        .filter(c => c.is_active === true)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
    return filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [categories, showActiveOnly])

  // 所有主题风格（不受筛选影响，用于"可添加的主题风格"）
  const allThemeStyles = useMemo(() => {
    return categories
      .filter(c => c.category_type === CategoryType.THEME_STYLE)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [categories])

  // 处理创建分类
  const handleCreate = async () => {
    try {
      if (!formData.category_code || !formData.category_label) {
        message.error('请填写分类代码和标签')
        return
      }

      await categoryService.createCategory(formData)
      message.success('创建成功')
      setCreateModalVisible(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  // 处理更新分类
  const handleUpdate = async (categoryId: string, updates: Partial<CategoryConfigRecord>) => {
    try {
      await categoryService.updateCategory(categoryId, updates)
      message.success('更新成功')
      fetchCategories()
    } catch (error: any) {
      message.error(error.message || '更新失败')
    }
  }

  // 上移/下移主题风格顺序
  const handleMoveThemeStyle = async (
    functionType: CategoryConfigRecord,
    themeCode: string,
    direction: 'up' | 'down'
  ) => {
    const currentStyles = functionType.extra_config?.supported_theme_styles || []
    const index = currentStyles.indexOf(themeCode)
    
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= currentStyles.length) return

    const newStyles = [...currentStyles]
    ;[newStyles[index], newStyles[newIndex]] = [newStyles[newIndex], newStyles[index]]
    
    await handleUpdate(functionType.category_id, {
      extra_config: {
        ...functionType.extra_config,
        supported_theme_styles: newStyles
      }
    })
  }

  // 添加主题风格到功能类型
  const handleAddThemeStyle = async (functionType: CategoryConfigRecord, themeStyle: CategoryConfigRecord) => {
    const currentStyles = functionType.extra_config?.supported_theme_styles || []
    if (currentStyles.includes(themeStyle.category_code)) {
      message.warning('该主题风格已存在')
      return
    }

    await handleUpdate(functionType.category_id, {
      extra_config: {
        ...functionType.extra_config,
        supported_theme_styles: [...currentStyles, themeStyle.category_code]
      }
    })
  }

  // 移除主题风格
  const handleRemoveThemeStyle = async (functionType: CategoryConfigRecord, themeCode: string) => {
    const currentStyles = functionType.extra_config?.supported_theme_styles || []
    const newStyles = currentStyles.filter(code => code !== themeCode)
    
    await handleUpdate(functionType.category_id, {
      extra_config: {
        ...functionType.extra_config,
        supported_theme_styles: newStyles
      }
    })
  }

  // 打开编辑弹窗
  const handleOpenEdit = (category: CategoryConfigRecord) => {
    setEditingCategory(category)
    setEditFormData({
      category_label: category.category_label || '',
      category_label_zh: category.category_label_zh || '',
      icon: category.icon || '',
      sort_order: category.sort_order ?? 0,
      is_active: category.is_active ?? true,
    })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingCategory) return

    try {
      if (!editFormData.category_label) {
        message.error('请填写分类标签')
        return
      }

      // 合并 extra_config，避免丢失字段（如功能类型的 supported_theme_styles）
      const updates: Partial<CategoryConfigRecord> = {
        category_label: editFormData.category_label,
        category_label_zh: editFormData.category_label_zh,
        icon: editFormData.icon,
        sort_order: editFormData.sort_order,
        is_active: editFormData.is_active,
        extra_config: {
          ...(editingCategory.extra_config || {}),
        }
      }

      await handleUpdate(editingCategory.category_id, updates)
      setEditModalVisible(false)
      setEditingCategory(null)
    } catch (error) {
      // handleUpdate 内部已经处理了错误提示
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      category_type: CategoryType.FUNCTION_TYPE,
      category_code: '',
      category_label: '',
      category_label_zh: '',
      icon: '',
      sort_order: 0,
      is_active: true,
      extra_config: {
        supported_theme_styles: [],
        is_featured: false,
      }
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={{ name: '管理员', avatarUrl: '' }} title="分类管理" />
        <div className="p-6 mt-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">分类管理</h1>
            <div className="flex items-center gap-4">
              <Checkbox
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              >
                只显示生效中的
              </Checkbox>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  resetForm()
                  setCreateModalVisible(true)
                }}
              >
                新建分类
              </Button>
            </div>
          </div>

          {/* 功能类型管理 */}
          <Card title="功能类型 (Function Type)" className="mb-6">
            {functionTypes.length === 0 && (
              <div className="text-center text-gray-400 py-8">暂无功能类型</div>
            )}
            {functionTypes.map(funcType => {
              const supportedStyles = funcType.extra_config?.supported_theme_styles || []
              const supportedThemeRecords = supportedStyles
                .map(code => allThemeStyles.find(t => t.category_code === code))
                .filter(Boolean) as CategoryConfigRecord[]

              return (
                <Card
                  key={funcType.category_id}
                  type="inner"
                  title={
                    <div className="flex items-center justify-between">
                      <span>
                        <Tag color="purple">{funcType.category_label}</Tag>
                        <span className="text-sm text-gray-500 ml-2">({funcType.category_code})</span>
                      </span>
                      <Space>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenEdit(funcType)}
                        >
                          编辑
                        </Button>
                        <Switch
                          checked={funcType.is_active}
                          onChange={(checked) => handleUpdate(funcType.category_id, { is_active: checked })}
                        />
                      </Space>
                    </div>
                  }
                  className="mb-4"
                >
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">支持的主题风格：</div>
                    <div className="space-y-2">
                      {supportedThemeRecords.map((theme, index) => (
                        <div
                          key={theme.category_id}
                          className="flex items-center justify-between p-2 bg-gray-100 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <DragOutlined className="text-gray-400" />
                            <Tag color="blue">{theme.category_label}</Tag>
                            <span className="text-sm text-gray-600">({theme.category_code})</span>
                          </div>
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowUpOutlined />}
                              disabled={index === 0}
                              onClick={() => handleMoveThemeStyle(funcType, theme.category_code, 'up')}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowDownOutlined />}
                              disabled={index === supportedThemeRecords.length - 1}
                              onClick={() => handleMoveThemeStyle(funcType, theme.category_code, 'down')}
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveThemeStyle(funcType, theme.category_code)}
                            />
                          </Space>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <div className="text-sm text-gray-600 mb-2">可添加的主题风格：</div>
                    <div className="flex flex-wrap gap-2">
                      {allThemeStyles
                        .filter(theme => !supportedStyles.includes(theme.category_code))
                        .map(theme => (
                          <Tag
                            key={theme.category_id}
                            color={theme.is_active ? "default" : "default"}
                            className="cursor-pointer"
                            style={!theme.is_active ? { opacity: 0.6, borderStyle: 'dashed' } : {}}
                            onClick={() => handleAddThemeStyle(funcType, theme)}
                          >
                            {theme.category_label}
                            {!theme.is_active && <span className="ml-1 text-xs text-gray-400">(已下线)</span>}
                          </Tag>
                        ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </Card>

          {/* 主题风格列表 */}
          <Card title="主题风格 (Theme Style)" className="mb-6">
            {themeStyles.length === 0 && (
              <div className="text-center text-gray-400 py-8">暂无主题风格</div>
            )}
            <div className="grid grid-cols-4 gap-4">
              {themeStyles.map(theme => (
                <Card key={theme.category_id} size="small">
                  <div className="flex items-center justify-between">
                    <Tag color="blue">{theme.category_label}</Tag>
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(theme)}
                      >
                        编辑
                      </Button>
                      <Switch
                        checked={theme.is_active}
                        onChange={(checked) => handleUpdate(theme.category_id, { is_active: checked })}
                      />
                    </Space>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{theme.category_code}</div>
                </Card>
              ))}
            </div>
          </Card>

          {/* 活动标签列表 */}
          <Card title="活动标签 (Activity Tag)">
            {activityTags.length === 0 && (
              <div className="text-center text-gray-400 py-8">暂无活动标签</div>
            )}
            <div className="grid grid-cols-4 gap-4">
              {activityTags.map(tag => (
                <Card key={tag.category_id} size="small">
                  <div className="flex items-center justify-between">
                    <Tag color="green">{tag.category_label}</Tag>
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(tag)}
                      >
                        编辑
                      </Button>
                      <Switch
                        checked={tag.is_active}
                        onChange={(checked) => handleUpdate(tag.category_id, { is_active: checked })}
                      />
                    </Space>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{tag.category_code}</div>
                </Card>
              ))}
            </div>
          </Card>

          {/* 创建分类弹窗 */}
          <Modal
            title="新建分类"
            open={createModalVisible}
            onOk={handleCreate}
            onCancel={() => {
              setCreateModalVisible(false)
              resetForm()
            }}
            width={600}
          >
            <div className="space-y-4">
              <div>
                <label className="block mb-2">分类类型</label>
                <Select
                  value={formData.category_type}
                  onChange={(value) => setFormData({ ...formData, category_type: value })}
                  className="w-full"
                >
                  <Option value={CategoryType.FUNCTION_TYPE}>功能类型</Option>
                  <Option value={CategoryType.THEME_STYLE}>主题风格</Option>
                  <Option value={CategoryType.ACTIVITY_TAG}>活动标签</Option>
                </Select>
              </div>
              <div>
                <label className="block mb-2">分类代码 *</label>
                <Input
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  placeholder="如: portrait, polaroid, discount"
                />
              </div>
              <div>
                <label className="block mb-2">分类标签 *</label>
                <Input
                  value={formData.category_label}
                  onChange={(e) => setFormData({ ...formData, category_label: e.target.value })}
                  placeholder="如: 个人写真, 拍立得, 折扣"
                />
              </div>
              <div>
                <label className="block mb-2">中文标签</label>
                <Input
                  value={formData.category_label_zh}
                  onChange={(e) => setFormData({ ...formData, category_label_zh: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block mb-2">图标</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="FontAwesome 图标名称，如: camera, user"
                />
              </div>
              <div>
                <label className="block mb-2">排序权重</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block mb-2">
                  <Switch
                    checked={formData.is_active}
                    onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="ml-2">是否激活</span>
                </label>
              </div>
            </div>
          </Modal>

          {/* 编辑分类弹窗 */}
          <Modal
            title="编辑分类"
            open={editModalVisible}
            onOk={handleSaveEdit}
            onCancel={() => {
              setEditModalVisible(false)
              setEditingCategory(null)
            }}
            width={600}
          >
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                按权重从小到大排序（值越小越靠前）
              </div>
              <div>
                <label className="block mb-2">分类类型</label>
                <Input
                  value={
                    editingCategory?.category_type === CategoryType.FUNCTION_TYPE
                      ? '功能类型'
                      : editingCategory?.category_type === CategoryType.THEME_STYLE
                      ? '主题风格'
                      : editingCategory?.category_type === CategoryType.ACTIVITY_TAG
                      ? '活动标签'
                      : editingCategory?.category_type || ''
                  }
                  disabled
                  className="w-full"
                />
              </div>
              <div>
                <label className="block mb-2">分类代码</label>
                <Input
                  value={editingCategory?.category_code || ''}
                  disabled
                  className="w-full"
                />
              </div>
              <div>
                <label className="block mb-2">分类标签 *</label>
                <Input
                  value={editFormData.category_label}
                  onChange={(e) => setEditFormData({ ...editFormData, category_label: e.target.value })}
                  placeholder="如: 个人写真, 拍立得, 折扣"
                />
              </div>
              <div>
                <label className="block mb-2">中文标签</label>
                <Input
                  value={editFormData.category_label_zh}
                  onChange={(e) => setEditFormData({ ...editFormData, category_label_zh: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block mb-2">图标</label>
                <Input
                  value={editFormData.icon}
                  onChange={(e) => setEditFormData({ ...editFormData, icon: e.target.value })}
                  placeholder="FontAwesome 图标名称，如: camera, user"
                />
              </div>
              <div>
                <label className="block mb-2">排序权重</label>
                <Input
                  type="number"
                  value={editFormData.sort_order}
                  onChange={(e) => setEditFormData({ ...editFormData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block mb-2">
                  <Switch
                    checked={editFormData.is_active}
                    onChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
                  />
                  <span className="ml-2">是否激活</span>
                </label>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  )
}

