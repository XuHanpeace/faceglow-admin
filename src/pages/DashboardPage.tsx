import { useState, useEffect } from 'react'
import { Card, DatePicker, Statistic, Table, message, Spin, Row, Col } from 'antd'
import { UserOutlined, EyeOutlined, FileImageOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { rumService } from '../services/rumService'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useNavigate, useLocation } from 'react-router-dom'

const { RangePicker } = DatePicker

interface DashboardData {
  pagePV: number
  pageUV: number
  appPV: number
  appUV: number
  newUsers: Array<{ date: string; count: number }>
  albumCreationPV: number
  albumCreationUV: number
  errors: Array<{ name: string; count: number; lastTime: string }>
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activePage, setActivePage] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ])

  // 处理导航
  const handleNavigate = (pageId: string) => {
    setActivePage(pageId)
    navigate(`/${pageId}`)
  }
  const [data, setData] = useState<DashboardData>({
    pagePV: 0,
    pageUV: 0,
    appPV: 0,
    appUV: 0,
    newUsers: [],
    albumCreationPV: 0,
    albumCreationUV: 0,
    errors: [],
  })

  // 获取数据
  const fetchData = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围')
      return
    }

    try {
      setLoading(true)

      const startTime = dateRange[0].startOf('day').unix()
      const endTime = dateRange[1].endOf('day').unix()

      // 使用批量调用，将 8 次 API 调用合并为 1 次
      const batchRequests = [
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckpv',
          ExtFirst: 'fg_pv_',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckuv',
          ExtFirst: 'fg_pv_',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckpv',
          ExtFirst: 'fg_action_',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckuv',
          ExtFirst: 'fg_action_',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'day',
          Name: 'fg_action_register',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckpv',
          Name: 'fg_click_album_create',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'ckuv',
          Name: 'fg_click_album_create',
        },
        {
          Action: 'DescribeDataEventUrl',
          Version: '2021-06-22',
          ProjectID: 'rum-6LsNkbT91rNlaj',
          StartTime: startTime,
          EndTime: endTime,
          Type: 'condition',
          ExtFirst: 'fg_error_',
        },
      ]

      const batchResults = await rumService.callRUMAPIBatch(batchRequests).catch(() => {
        // 如果批量调用失败，返回空结果数组
        return Array(8).fill(null).map((_, index) => ({
          success: false,
          index,
          error: '批量调用失败',
        }))
      })

      // 解析批量调用结果
      const [
        pagePVResult,
        pageUVResult,
        appPVResult,
        appUVResult,
        newUserResult,
        albumPVResult,
        albumUVResult,
        errorResult,
      ] = batchResults.map((result) => {
        if (result.success && result.data) {
          // SDK 返回的数据格式：{ Response: { ... } }
          return result.data.Response || result.data
        }
        // 失败时返回空结果
        return { results: [] }
      })

      // 处理页面PV/UV
      const pagePV = pagePVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0
      const pageUV = pageUVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0

      // 处理APP PV/UV
      const appPV = appPVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0
      const appUV = appUVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0

      // 处理新用户注册（按天）
      const newUsers = newUserResult.results?.map((item: any) => ({
        date: item.date || '',
        count: item.total || 0,
      })) || []

      // 处理Album点击创作
      const albumCreationPV = albumPVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0
      const albumCreationUV = albumUVResult.results?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0

      // 处理错误报表
      const errors = errorResult.results?.map((item: any) => ({
        name: item.name || '未知错误',
        count: item.total || 0,
        lastTime: item.last_time || '',
      })) || []

      setData({
        pagePV,
        pageUV,
        appPV,
        appUV,
        newUsers,
        albumCreationPV,
        albumCreationUV,
        errors,
      })
    } catch (error: any) {
      console.error('获取数据失败:', error)
      message.error(error.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const errorColumns = [
    {
      title: '错误名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '错误次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '最后发生时间',
      dataIndex: 'lastTime',
      key: 'lastTime',
    },
  ]

  const newUserColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '新用户数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
  ]

  // 根据当前路由更新 activePage
  useEffect(() => {
    const currentPath = location.pathname.replace('/', '') || 'dashboard'
    setActivePage(currentPath)
  }, [location.pathname])

  return (
    <div className="flex">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={{ name: '管理员', avatarUrl: '' }} title="数据大盘" />
        <main className="p-6 mt-16">
          <Card
            title="数据大盘"
            extra={
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]])
                  }
                }}
                format="YYYY-MM-DD"
              />
            }
          >
            <Spin spinning={loading}>
          {/* 核心指标 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="页面PV"
                  value={data.pagePV}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="页面UV"
                  value={data.pageUV}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="APP PV"
                  value={data.appPV}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="APP UV"
                  value={data.appUV}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Album创作数据 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Album点击创作PV"
                  value={data.albumCreationPV}
                  prefix={<FileImageOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Album点击创作UV"
                  value={data.albumCreationUV}
                  prefix={<FileImageOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 新用户注册（按天） */}
          <Card title="新用户注册（按天）" style={{ marginBottom: 24 }}>
            <Table
              dataSource={data.newUsers}
              columns={newUserColumns}
              rowKey="date"
              pagination={false}
              size="small"
            />
          </Card>

          {/* 错误报表 */}
          <Card title="自定义上报错误报表" extra={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}>
            <Table
              dataSource={data.errors}
              columns={errorColumns}
              rowKey="name"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
            </Spin>
          </Card>
        </main>
      </div>
    </div>
  )
}

