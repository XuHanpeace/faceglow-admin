// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Package, Truck, CreditCard, CheckCircle, XCircle, RotateCcw, MapPin, User, Phone, AlertCircle, Eye } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline';
import { OrderActions } from '@/components/OrderActions';
import { OrderItemsList } from '@/components/OrderItemsList';
import { ShippingInfo } from '@/components/ShippingInfo';
import { OrderSummary } from '@/components/OrderSummary';
import { OrderNotes } from '@/components/OrderNotes';
import { StatusHistory } from '@/components/StatusHistory';
export default function OrderDetail(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('orders');
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [note, setNote] = React.useState('');

  // 获取订单ID
  const orderId = props.$w.page.dataset.params.orderId;

  // 获取订单详情
  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: orderId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (response) {
        // 修复：使用实际数据结构处理订单数据
        const processedOrder = {
          id: response._id,
          orderNumber: response.orderNumber || response._id,
          customer: response.shipping_address?.name || '匿名用户',
          phone: response.shipping_address?.phone || '',
          email: response.shipping_address?.email || '',
          address: response.shipping_address ? `${response.shipping_address.province || ''}${response.shipping_address.city || ''}${response.shipping_address.district || ''}${response.shipping_address.detail || ''}` : '地址未填写',
          amount: response.final_total || response.total || 0,
          status: response.status || '待处理',
          items: response.items || [],
          createdAt: response.createdAt,
          paymentMethod: response.payment_method || '未知',
          trackingNumber: response.tracking_number || '',
          orderNotes: response.order_notes || '',
          logisticsCompany: response.logistics_company || '',
          shipping_address: response.shipping_address || {},
          // 修复：直接使用原始字段名
          statusHistory: response.statusHistory || [],
          paidAt: response.paid_at,
          shippedAt: response.shipped_at,
          deliveredAt: response.delivered_at,
          canceledAt: response.canceled_at,
          cancelReason: response.cancel_reason || ''
        };
        setOrder(processedOrder);
      } else {
        setError('订单不存在');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      setError(`获取订单详情失败: ${error.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    } else {
      setError('订单ID不能为空');
    }
  }, [orderId]);
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
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
      '已送达': <CheckCircle className="w-5 h-5" />,
      '已发货': <Truck className="w-5 h-5" />,
      '配送中': <Truck className="w-5 h-5" />,
      '待发货': <Package className="w-5 h-5" />,
      '待付款': <CreditCard className="w-5 h-5" />,
      '已付款': <CheckCircle className="w-5 h-5" />,
      '已取消': <XCircle className="w-5 h-5" />,
      '已退款': <RotateCcw className="w-5 h-5" />
    };
    return iconMap[status] || <Package className="w-5 h-5" />;
  };
  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    setActionLoading(true);
    try {
      const updateData = {
        status: newStatus,
        ...additionalData,
        updatedAt: Date.now()
      };

      // 修复：使用正确的字段名
      if (newStatus === '已付款') {
        updateData.paid_at = Date.now();
      } else if (newStatus === '已发货') {
        updateData.shipped_at = Date.now();
      } else if (newStatus === '已送达') {
        updateData.delivered_at = Date.now();
      } else if (newStatus === '已取消') {
        updateData.canceled_at = Date.now();
      }
      await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaUpdateV2',
        params: {
          data: updateData,
          filter: {
            where: {
              _id: {
                $eq: orderId
              }
            }
          }
        }
      });

      // 添加状态历史记录
      const historyEntry = {
        status: newStatus,
        timestamp: Date.now(),
        note: additionalData.cancel_reason || ''
      };
      await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            statusHistory: [...(order.statusHistory || []), historyEntry]
          },
          filter: {
            where: {
              _id: {
                $eq: orderId
              }
            }
          }
        }
      });

      // 修复：立即刷新订单详情
      await fetchOrderDetail();
      alert('操作成功');
    } catch (error) {
      console.error('操作失败:', error);
      alert(`操作失败: ${error.message || '请稍后重试'}`);
    } finally {
      setActionLoading(false);
    }
  };
  const addOrderNote = async noteText => {
    if (!noteText.trim()) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'pop_order',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            order_notes: noteText,
            updatedAt: Date.now()
          },
          filter: {
            where: {
              _id: {
                $eq: orderId
              }
            }
          }
        }
      });
      alert('备注添加成功');
      await fetchOrderDetail(); // 修复：立即刷新
    } catch (error) {
      console.error('添加备注失败:', error);
      alert('添加备注失败，请稍后重试');
    }
  };
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
                <Button onClick={fetchOrderDetail} variant="outline" className="rounded-full">
                  重新加载
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>;
  }
  if (!order) {
    return <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">订单不存在</h3>
                <Button onClick={() => handleNavigate('orders')} variant="outline" className="rounded-full">
                  返回订单列表
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
          <div className="mb-8">
            <button onClick={() => handleNavigate('orders')} className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors">
              <ArrowLeft className="mr-2" size={20} />
              <span className="font-medium">返回订单列表</span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">订单详情</h1>
                <p className="text-slate-600 text-lg">订单号: <span className="font-mono text-blue-600">{order.orderNumber}</span></p>
              </div>
              <Badge className={`${getStatusColor(order.status)} px-4 py-2 text-lg`}>
                {getStatusIcon(order.status)}
                <span className="ml-2">{order.status}</span>
              </Badge>
            </div>
          </div>

          {/* 状态进度条 */}
          <OrderStatusTimeline currentStatus={order.status} />

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* 左侧主要内容 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 操作区域 */}
              <OrderActions order={order} onStatusUpdate={handleStatusUpdate} onTrackingUpdate={(trackingNumber, logisticsCompany) => handleStatusUpdate('已发货', {
              tracking_number: trackingNumber,
              logistics_company: logisticsCompany
            })} loading={actionLoading} />

              {/* 商品列表 */}
              <OrderItemsList items={order.items} totalAmount={order.amount} />

              {/* 订单备注 */}
              <OrderNotes notes={order.orderNotes} onAddNote={addOrderNote} />

              {/* 状态历史 */}
              <StatusHistory history={order.statusHistory} />
            </div>

            {/* 右侧信息栏 */}
            <div className="space-y-8">
              {/* 修复：使用正确的字段名传递收货信息 */}
              <ShippingInfo shippingAddress={order.shipping_address} />

              {/* 订单详情 */}
              <OrderSummary order={order} />

              {/* 快捷操作 */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <CardTitle className="text-white">快捷操作</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-slate-50 transition-colors" onClick={() => handleNavigate('orders')}>
                    <ArrowLeft className="mr-2" size={16} />
                    返回订单列表
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-slate-50 transition-colors" onClick={() => window.print()}>
                    <Eye className="mr-2" size={16} />
                    打印订单
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>;
}