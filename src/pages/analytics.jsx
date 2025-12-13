// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Calendar, Download, Filter, RefreshCw, TrendingUp, Users, ShoppingBag, DollarSign, MapPin, Activity, FileText, X } from 'lucide-react';
// @ts-ignore;
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Label } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EnhancedAnalyticsChart, ChartContainer } from '@/components/EnhancedAnalyticsChart';
// CSV导出工具函数
const exportToCSV = (data, filename) => {
  const csvContent = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 格式化数据为CSV格式
const formatDataForCSV = (data, headers) => {
  const csvRows = [headers.join(',')];
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
};
export default function Analytics(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('analytics');
  const [dateRange, setDateRange] = React.useState('last7days');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedChart, setSelectedChart] = React.useState('line');
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [exportOptions, setExportOptions] = React.useState({
    dataType: 'sales',
    timeRange: 'last7days',
    includeHeaders: true,
    format: 'csv'
  });

  // 模拟数据 - 销售趋势
  const salesTrendData = [{
    name: '00:00',
    value: 400
  }, {
    name: '04:00',
    value: 300
  }, {
    name: '08:00',
    value: 600
  }, {
    name: '12:00',
    value: 800
  }, {
    name: '16:00',
    value: 700
  }, {
    name: '20:00',
    value: 900
  }, {
    name: '24:00',
    value: 600
  }];
  const weeklySalesData = [{
    name: '周一',
    value: 4000
  }, {
    name: '周二',
    value: 3000
  }, {
    name: '周三',
    value: 5000
  }, {
    name: '周四',
    value: 2780
  }, {
    name: '周五',
    value: 6890
  }, {
    name: '周六',
    value: 7390
  }, {
    name: '周日',
    value: 5490
  }];
  const monthlySalesData = [{
    name: '1月',
    value: 65000
  }, {
    name: '2月',
    value: 59000
  }, {
    name: '3月',
    value: 80000
  }, {
    name: '4月',
    value: 81000
  }, {
    name: '5月',
    value: 56000
  }, {
    name: '6月',
    value: 55000
  }, {
    name: '7月',
    value: 40000
  }];
  const categoryData = [{
    name: '手机',
    value: 35
  }, {
    name: '笔记本',
    value: 25
  }, {
    name: '耳机',
    value: 20
  }, {
    name: '平板',
    value: 15
  }, {
    name: '配件',
    value: 5
  }];
  const userBehaviorData = [{
    subject: '浏览',
    value: 85
  }, {
    subject: '加购',
    value: 65
  }, {
    subject: '下单',
    value: 45
  }, {
    subject: '支付',
    value: 35
  }, {
    subject: '复购',
    value: 25
  }];
  const priceSalesData = [{
    x: 100,
    y: 200
  }, {
    x: 200,
    y: 260
  }, {
    x: 300,
    y: 400
  }, {
    x: 400,
    y: 280
  }, {
    x: 500,
    y: 500
  }, {
    x: 600,
    y: 320
  }, {
    x: 700,
    y: 480
  }, {
    x: 800,
    y: 350
  }];
  const regionData = [{
    name: '北京',
    value: 4500
  }, {
    name: '上海',
    value: 3800
  }, {
    name: '广州',
    value: 3200
  }, {
    name: '深圳',
    value: 2900
  }, {
    name: '杭州',
    value: 2100
  }, {
    name: '成都',
    value: 1800
  }, {
    name: '武汉',
    value: 1500
  }];
  const userFunnelData = [{
    name: '访问',
    value: 10000
  }, {
    name: '浏览商品',
    value: 7500
  }, {
    name: '加入购物车',
    value: 3200
  }, {
    name: '提交订单',
    value: 1800
  }, {
    name: '完成支付',
    value: 1200
  }];
  const metrics = [{
    title: '总销售额',
    value: '¥124,563',
    icon: DollarSign,
    trend: 'up',
    trendValue: 12.5,
    color: 'text-green-600'
  }, {
    title: '订单总数',
    value: '1,234',
    icon: ShoppingBag,
    trend: 'up',
    trendValue: 8.2,
    color: 'text-blue-600'
  }, {
    title: '新增用户',
    value: '456',
    icon: Users,
    trend: 'up',
    trendValue: 15.3,
    color: 'text-purple-600'
  }, {
    title: '转化率',
    value: '3.2%',
    icon: TrendingUp,
    trend: 'down',
    trendValue: 2.1,
    color: 'text-red-600'
  }, {
    title: '客单价',
    value: '¥101',
    icon: Activity,
    trend: 'up',
    trendValue: 5.7,
    color: 'text-orange-600'
  }, {
    title: '复购率',
    value: '28.5%',
    icon: require('lucide-react').Repeat,
    trend: 'up',
    trendValue: 3.2,
    color: 'text-indigo-600'
  }];

  // 导出数据函数
  const handleExportData = () => {
    let exportData = [];
    let filename = '';
    let headers = [];
    switch (exportOptions.dataType) {
      case 'sales':
        exportData = weeklySalesData.map(item => ({
          日期: item.name,
          销售额: item.value
        }));
        headers = ['日期', '销售额'];
        filename = `销售数据_${exportOptions.timeRange}.csv`;
        break;
      case 'category':
        exportData = categoryData.map(item => ({
          分类: item.name,
          占比: item.value + '%'
        }));
        headers = ['分类', '占比'];
        filename = `商品分类数据_${exportOptions.timeRange}.csv`;
        break;
      case 'region':
        exportData = regionData.map(item => ({
          地区: item.name,
          销售额: item.value
        }));
        headers = ['地区', '销售额'];
        filename = `地区销售数据_${exportOptions.timeRange}.csv`;
        break;
      case 'user':
        exportData = userFunnelData.map(item => ({
          阶段: item.name,
          用户数: item.value
        }));
        headers = ['阶段', '用户数'];
        filename = `用户转化数据_${exportOptions.timeRange}.csv`;
        break;
      case 'metrics':
        exportData = metrics.map(item => ({
          指标: item.title,
          数值: item.value,
          趋势: item.trend === 'up' ? '上升' : '下降',
          变化率: item.trendValue + '%'
        }));
        headers = ['指标', '数值', '趋势', '变化率'];
        filename = `关键指标数据_${exportOptions.timeRange}.csv`;
        break;
    }
    const csvContent = formatDataForCSV(exportData, headers);
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  };
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
              <p className="text-slate-600 mt-1">深入了解您的业务表现和趋势</p>
            </div>
            <div className="flex items-center space-x-3">
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="last7days">最近7天</option>
                <option value="last30days">最近30天</option>
                <option value="last90days">最近90天</option>
                <option value="thisYear">今年</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                <Filter size={16} />
                <span>高级筛选</span>
              </button>
              <button onClick={handleRefresh} disabled={isRefreshing} className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isRefreshing ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
                <span>{isRefreshing ? '刷新中...' : '刷新数据'}</span>
              </button>
              <button onClick={() => setShowExportDialog(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download size={16} />
                <span>导出报告</span>
              </button>
            </div>
          </div>

          {/* 关键指标 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {metrics.map((metric, index) => <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-opacity-10 ${metric.color.replace('text-', 'bg-')}`}>
                    <metric.icon className={`${metric.color}`} size={20} />
                  </div>
                </div>
                {metric.trend && <div className="flex items-center mt-2">
                    <span className={`text-xs ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {metric.trend === 'up' ? '↑' : '↓'} {metric.trendValue}%
                    </span>
                    <span className="text-xs text-slate-500 ml-1">vs 上期</span>
                  </div>}
              </div>)}
          </div>

          {/* 图表区域 - 第一行 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <EnhancedAnalyticsChart type="line" data={salesTrendData} title="今日销售趋势（24小时）" />
            <EnhancedAnalyticsChart type="area" data={weeklySalesData} title="本周销售趋势" />
          </div>

          {/* 图表区域 - 第二行 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <EnhancedAnalyticsChart type="pie" data={categoryData} title="商品分类销售占比" />
            <EnhancedAnalyticsChart type="radar" data={userBehaviorData} title="用户行为分析" />
            <EnhancedAnalyticsChart type="bar" data={regionData} title="地域销售分布" />
          </div>

          {/* 图表区域 - 第三行 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer title="价格与销量关系分析" description="分析商品价格对销量的影响">
              <EnhancedAnalyticsChart type="scatter" data={priceSalesData} title="" height={250} />
            </ChartContainer>
            <ChartContainer title="用户转化漏斗" description="从访问到购买的完整转化路径">
              <EnhancedAnalyticsChart type="bar" data={userFunnelData} title="" height={250} />
            </ChartContainer>
          </div>

          {/* 数据表格 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">详细数据报表</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">指标</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">今日</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">昨日</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">本周</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">本月</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">同比</th>
                  </tr>
                </thead>
                <tbody>
                  {[{
                  metric: '销售额',
                  today: '¥12,345',
                  yesterday: '¥11,234',
                  week: '¥86,543',
                  month: '¥345,678',
                  yoy: '+15.3%'
                }, {
                  metric: '订单数',
                  today: '123',
                  yesterday: '112',
                  week: '856',
                  month: '3,421',
                  yoy: '+8.7%'
                }, {
                  metric: '访客数',
                  today: '1,234',
                  yesterday: '1,123',
                  week: '8,765',
                  month: '34,567',
                  yoy: '+22.1%'
                }, {
                  metric: '转化率',
                  today: '3.2%',
                  yesterday: '3.1%',
                  week: '3.4%',
                  month: '3.3%',
                  yoy: '+0.5%'
                }].map((row, index) => <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.metric}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{row.today}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.yesterday}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{row.week}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{row.month}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">{row.yoy}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* 导出对话框 */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>导出数据报告</DialogTitle>
                <DialogDescription>
                  选择要导出的数据类型和时间范围
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>数据类型</Label>
                  <Select value={exportOptions.dataType} onValueChange={value => setExportOptions(prev => ({
                  ...prev,
                  dataType: value
                }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">销售数据</SelectItem>
                      <SelectItem value="category">商品分类数据</SelectItem>
                      <SelectItem value="region">地区销售数据</SelectItem>
                      <SelectItem value="user">用户转化数据</SelectItem>
                      <SelectItem value="metrics">关键指标数据</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>时间范围</Label>
                  <Select value={exportOptions.timeRange} onValueChange={value => setExportOptions(prev => ({
                  ...prev,
                  timeRange: value
                }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">今天</SelectItem>
                      <SelectItem value="yesterday">昨天</SelectItem>
                      <SelectItem value="last7days">最近7天</SelectItem>
                      <SelectItem value="last30days">最近30天</SelectItem>
                      <SelectItem value="last90days">最近90天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-headers" checked={exportOptions.includeHeaders} onCheckedChange={checked => setExportOptions(prev => ({
                  ...prev,
                  includeHeaders: checked
                }))} />
                  <Label htmlFor="include-headers">包含表头</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleExportData} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  导出CSV
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>;
}