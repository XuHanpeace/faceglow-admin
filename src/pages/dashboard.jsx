// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { DollarSign, ShoppingCart, Users, Package, Plus, Eye, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
// @ts-ignore;
import { Button } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export default function Dashboard(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('dashboard');
  const [stats, setStats] = React.useState([]);
  const [salesData, setSalesData] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // 获取订单数据
  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取最近30天的订单
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orderParams = {
        pageNumber: 1,
        pageSize: 5,
        getCount: true,
        orderBy: [{
          createdAt: 'desc'
        }],
        filter: {
          where: {
            createdAt: {
              $gte: thirtyDaysAgo.getTime()
            }
          }
        }
      };
      const response = await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaGetRecordsV2',
        params: orderParams
      });
      const orderRecords = response.records || [];

      // 处理订单数据
      const processedOrders = orderRecords.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber || `#${order._id.slice(-6)}`,
        customer: order.shipping_address?.name || '匿名用户',
        amount: order.finalTotal || order.total || 0,
        status: order.status || '待处理',
        date: new Date(order.createdAt).toLocaleDateString('zh-CN'),
        items: order.items ? order.items.length : 0,
        createdAt: order.createdAt
      }));
      setOrders(processedOrders);

      // 计算统计数据
      const totalSales = orderRecords.reduce((sum, order) => sum + (order.finalTotal || order.total || 0), 0);
      const totalOrders = orderRecords.length;
      const completedOrders = orderRecords.filter(order => order.status === '已送达').length;
      const pendingOrders = orderRecords.filter(order => order.status === '待发货' || order.status === '待付款').length;

      // 生成销售趋势数据（按天聚合）
      const salesByDate = {};
      orderRecords.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        });
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += order.finalTotal || order.total || 0;
      });

      // 转换为图表数据格式
      const chartData = Object.entries(salesByDate).map(([date, sales]) => ({
        name: date,
        sales
      })).sort((a, b) => new Date(a.name) - new Date(b.name)).slice(-7); // 最近7天

      setSalesData(chartData);

      // 设置统计卡片数据
      setStats([{
        title: '总销售额',
        value: `¥${totalSales.toLocaleString()}`,
        change: '+12.5%',
        changeType: 'up',
        icon: DollarSign
      }, {
        title: '总订单数',
        value: totalOrders.toString(),
        change: '+8.2%',
        changeType: 'up',
        icon: ShoppingCart
      }, {
        title: '已完成订单',
        value: completedOrders.toString(),
        change: '+15.3%',
        changeType: 'up',
        icon: TrendingUp
      }, {
        title: '待处理订单',
        value: pendingOrders.toString(),
        change: '-5.1%',
        changeType: 'down',
        icon: TrendingDown
      }]);
    } catch (error) {
      console.error('获取订单数据失败:', error);
      setError(`获取订单数据失败: ${error.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    fetchOrderData();
  }, []);
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const handleQuickAction = action => {
    switch (action) {
      case 'add-product':
        $w.utils.navigateTo({
          pageId: 'products',
          params: {
            action: 'add'
          }
        });
        break;
      case 'process-orders':
        $w.utils.navigateTo({
          pageId: 'orders',
          params: {
            filter: 'pending'
          }
        });
        break;
      case 'view-reports':
        $w.utils.navigateTo({
          pageId: 'analytics',
          params: {}
        });
        break;
      case 'manage-users':
        $w.utils.navigateTo({
          pageId: 'users',
          params: {}
        });
        break;
      default:
        break;
    }
  };
  const handleViewOrder = orderId => {
    $w.utils.navigateTo({
      pageId: 'orders',
      params: {
        orderId: orderId
      }
    });
  };
  const handleViewOrdersByStatus = status => {
    $w.utils.navigateTo({
      pageId: 'orders',
      params: {
        status: status
      }
    });
  };
  const getStatusColor = status => {
    const colorMap = {
      '已送达': 'bg-green-100 text-green-800 hover:bg-green-200',
      '已发货': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      '配送中': 'bg-sky-100 text-sky-800 hover:bg-sky-200',
      '待发货': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      '待付款': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      '已付款': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      '已取消': 'bg-red-100 text-red-800 hover:bg-red-200',
      '已退款': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };
  const getStatusText = status => {
    return status;
  };
  if (loading) {
    return <div className="flex h-screen bg-slate-50">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">加载数据中...</span>
            </div>
          </main>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex h-screen bg-slate-50">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">数据加载失败</h3>
                <p className="text-slate-600 mb-4">{error}</p>
                <Button onClick={fetchOrderData} variant="outline" size="sm">
                  重新加载
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>;
  }
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">欢迎回来！</h1>
            <p className="text-slate-600 mt-1">这是您的动漫手办电商后台仪表盘</p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => <StatCard key={index} {...stat} />)}
          </div>

          {/* 图表和订单 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">销售趋势</h3>
                {salesData.length > 0 ? <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip formatter={value => [`¥${value}`, '销售额']} />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{
                    fill: '#3b82f6',
                    strokeWidth: 2,
                    r: 4
                  }} />
                    </LineChart>
                  </ResponsiveContainer> : <div className="flex items-center justify-center h-64 text-slate-500">
                    暂无销售数据
                  </div>}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">快捷操作</h3>
                <div className="space-y-3">
                  <button onClick={() => handleQuickAction('add-product')} className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center">
                    <Plus className="mr-2" size={16} />
                    添加新手办
                  </button>
                  <button onClick={() => handleQuickAction('process-orders')} className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center">
                    <ShoppingCart className="mr-2" size={16} />
                    处理待发货订单
                  </button>
                  <button onClick={() => handleQuickAction('view-reports')} className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center">
                    <Eye className="mr-2" size={16} />
                    查看销售报表
                  </button>
                  <button onClick={() => handleQuickAction('manage-users')} className="w-full text-left px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors flex items-center">
                    <Users className="mr-2" size={16} />
                    用户管理
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 订单列表 */}
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">最近订单</h3>
                <button onClick={() => handleViewOrdersByStatus('all')} className="text-sm text-blue-600 hover:text-blue-500">
                  查看全部订单 →
                </button>
              </div>
              
              {error ? <div className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">订单数据加载失败</h3>
                  <p className="text-slate-600 mb-4">{error}</p>
                  <Button onClick={fetchOrderData} variant="outline" size="sm">
                    重新加载
                  </Button>
                </div> : orders.length > 0 ? <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">订单号</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">客户</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">金额</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">状态</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">日期</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{order.orderNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.customer}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">¥{order.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleViewOrdersByStatus(order.status)} className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.date}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleViewOrder(order.id)} className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                              查看详情
                            </button>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div> : <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">暂无订单数据</p>
                </div>}
              <div className="px-6 py-3 border-t border-slate-200">
                <button onClick={() => handleViewOrdersByStatus('all')} className="text-sm text-blue-600 hover:text-blue-500">
                  查看所有订单 →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}