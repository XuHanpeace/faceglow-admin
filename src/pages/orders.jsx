// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Badge, Button, Input } from '@/components/ui';
// @ts-ignore;
import { Search, Eye, Package, Clock, CheckCircle, XCircle, RotateCcw, Truck, CreditCard, AlertCircle } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Pagination } from '@/components/Pagination';
export default function Orders(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('orders');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const itemsPerPage = 10;

  // 获取订单数据
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        getCount: true,
        orderBy: [{
          createdAt: 'desc'
        }]
      };

      // 构建筛选条件
      const filterConditions = [];
      if (searchTerm) {
        filterConditions.push({
          $or: [{
            orderNumber: {
              $search: searchTerm
            }
          }, {
            'shipping_address.name': {
              $search: searchTerm
            }
          }]
        });
      }
      if (statusFilter !== 'all') {
        filterConditions.push({
          status: {
            $eq: statusFilter
          }
        });
      }
      if (filterConditions.length > 0) {
        params.filter = {
          where: {
            $and: filterConditions
          }
        };
      }
      const response = await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaGetRecordsV2',
        params
      });
      const orderRecords = response.records || [];

      // 处理订单数据 - 使用实际数据结构
      const processedOrders = orderRecords.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber || order._id,
        customer: order.shipping_address?.name || '匿名用户',
        amount: order.final_total || order.total || 0,
        status: order.status || '待处理',
        date: new Date(order.createdAt).toLocaleDateString('zh-CN'),
        items: order.items ? order.items.length : 0,
        createdAt: order.createdAt,
        paymentMethod: order.payment_method || '未知',
        trackingNumber: order.tracking_number || '',
        shippingAddress: order.shipping_address || {},
        itemsData: order.items || []
      }));
      setOrders(processedOrders);
      setTotalItems(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / itemsPerPage) || 1);
    } catch (error) {
      console.error('获取订单数据失败:', error);
      setError(`获取订单数据失败: ${error.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const handleViewOrder = orderId => {
    $w.utils.navigateTo({
      pageId: 'order-detail',
      params: {
        orderId
      }
    });
  };
  const getStatusColor = status => {
    const colorMap = {
      '已送达': 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      '已发货': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      '配送中': 'bg-gradient-to-r from-sky-500 to-sky-600 text-white',
      '待发货': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      '待付款': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      '已付款': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      '已取消': 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      '已退款': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    };
    return colorMap[status] || 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
  };
  const getStatusIcon = status => {
    const iconMap = {
      '已送达': <CheckCircle className="w-4 h-4" />,
      '已发货': <Truck className="w-4 h-4" />,
      '配送中': <Truck className="w-4 h-4" />,
      '待发货': <Package className="w-4 h-4" />,
      '待付款': <CreditCard className="w-4 h-4" />,
      '已付款': <CheckCircle className="w-4 h-4" />,
      '已取消': <XCircle className="w-4 h-4" />,
      '已退款': <RotateCcw className="w-4 h-4" />
    };
    return iconMap[status] || <Package className="w-4 h-4" />;
  };
  const statusOptions = [{
    value: 'all',
    label: '全部订单',
    icon: <Package className="w-4 h-4" />
  }, {
    value: '待付款',
    label: '待付款',
    icon: <CreditCard className="w-4 h-4" />
  }, {
    value: '已付款',
    label: '已付款',
    icon: <CheckCircle className="w-4 h-4" />
  }, {
    value: '待发货',
    label: '待发货',
    icon: <Package className="w-4 h-4" />
  }, {
    value: '已发货',
    label: '已发货',
    icon: <Truck className="w-4 h-4" />
  }, {
    value: '配送中',
    label: '配送中',
    icon: <Truck className="w-4 h-4" />
  }, {
    value: '已送达',
    label: '已送达',
    icon: <CheckCircle className="w-4 h-4" />
  }, {
    value: '已取消',
    label: '已取消',
    icon: <XCircle className="w-4 h-4" />
  }, {
    value: '已退款',
    label: '已退款',
    icon: <RotateCcw className="w-4 h-4" />
  }];
  if (loading) {
    return <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-400 opacity-20"></div>
              </div>
              <span className="ml-4 text-slate-600 text-lg">加载中...</span>
            </div>
          </main>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">加载失败</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={fetchOrders} variant="outline" className="rounded-full">
                  重新加载
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>;
  }
  return <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
            <p className="text-slate-600 mt-1">查看和管理所有订单</p>
          </div>

          {/* 搜索和状态选择器 */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <Input type="text" placeholder="搜索订单号或客户姓名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                </div>
              </div>
              
              {/* 标签式状态选择器 */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => <button key={option.value} onClick={() => setStatusFilter(option.value)} className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${statusFilter === option.value ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </button>)}
                </div>
              </div>
            </div>
          </div>

          {/* 订单统计 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">总订单</p>
                  <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">已完成</p>
                  <p className="text-2xl font-bold text-slate-900">{orders.filter(o => o.status === '已送达').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Truck className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">运输中</p>
                  <p className="text-2xl font-bold text-slate-900">{orders.filter(o => ['已发货', '配送中'].includes(o.status)).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">已取消</p>
                  <p className="text-2xl font-bold text-slate-900">{orders.filter(o => o.status === '已取消').length}</p>
                </div>
              </div>
            </div>
          </div>

          {orders.length > 0 ? <>
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">订单号</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">客户</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">商品数量</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">金额</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">状态</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">日期</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{order.orderNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{order.customer}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex items-center">
                              {getStatusIcon(order.status)}
                              <span className="ml-2">{order.items} 件</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">¥{order.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order.id)} className="text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4 mr-1" />
                                详情
                              </Button>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && <div className="px-6 py-4 border-t border-slate-200">
                    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                  </div>}
              </div>
            </> : <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">暂无订单数据</p>
            </div>}
        </main>
      </div>
    </div>;
}