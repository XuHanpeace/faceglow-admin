// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Button } from '@/components/ui';
// @ts-ignore;
import { CreditCard, Truck, CheckCircle, XCircle, Package, Eye } from 'lucide-react';

export function OrderActions({
  order,
  onStatusUpdate,
  onTrackingUpdate,
  loading
}) {
  const [trackingNumber, setTrackingNumber] = React.useState(order.trackingNumber || '');
  const [logisticsCompany, setLogisticsCompany] = React.useState(order.logisticsCompany || '');
  const [cancelReason, setCancelReason] = React.useState('');
  const [showShipForm, setShowShipForm] = React.useState(false);
  const [showCancelForm, setShowCancelForm] = React.useState(false);

  // 修复：使用实际数据字段
  React.useEffect(() => {
    setTrackingNumber(order.trackingNumber || '');
    setLogisticsCompany(order.logisticsCompany || '');
  }, [order.trackingNumber, order.logisticsCompany]);
  const getActionConfig = () => {
    const configs = {
      '待付款': {
        title: '付款处理',
        description: '确认客户已完成付款或取消订单',
        actions: [{
          label: '确认付款',
          icon: <CreditCard className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          action: () => onStatusUpdate('已付款')
        }, {
          label: '取消订单',
          icon: <XCircle className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          action: () => setShowCancelForm(true)
        }]
      },
      '已付款': {
        title: '发货处理',
        description: '确认收到款项，准备安排发货',
        actions: [{
          label: '确认发货',
          icon: <Truck className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          action: () => setShowShipForm(true)
        }]
      },
      '待发货': {
        title: '发货处理',
        description: '填写物流信息并确认发货',
        actions: [{
          label: '确认发货',
          icon: <Truck className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          action: () => setShowShipForm(true)
        }]
      },
      '已发货': {
        title: '物流管理',
        description: '查看或更新物流信息',
        actions: [{
          label: '更新物流',
          icon: <Truck className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700',
          action: () => setShowShipForm(true)
        }, {
          label: '确认收货',
          icon: <CheckCircle className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          action: () => onStatusUpdate('已送达')
        }]
      },
      '配送中': {
        title: '确认收货',
        description: '确认客户已收到商品',
        actions: [{
          label: '确认收货',
          icon: <CheckCircle className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          action: () => onStatusUpdate('已送达')
        }]
      },
      '已送达': {
        title: '订单完成',
        description: '订单已成功送达',
        actions: [{
          label: '查看详情',
          icon: <Eye className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          action: () => {}
        }]
      },
      '已取消': {
        title: '订单已取消',
        description: '订单已被取消',
        actions: [{
          label: '查看原因',
          icon: <Eye className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          action: () => {}
        }]
      },
      '已退款': {
        title: '退款完成',
        description: '退款已处理完成',
        actions: [{
          label: '查看详情',
          icon: <Eye className="w-5 h-5 mr-2" />,
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
          action: () => {}
        }]
      }
    };
    return configs[order.status] || {
      title: '订单信息',
      description: '查看订单详情',
      actions: []
    };
  };
  const handleConfirmShip = async () => {
    if (!trackingNumber.trim() || !logisticsCompany.trim()) {
      alert('请填写完整的物流信息');
      return;
    }

    // 修复：使用正确的字段名
    await onStatusUpdate('已发货', {
      tracking_number: trackingNumber,
      logistics_company: logisticsCompany
    });
    setShowShipForm(false);
  };
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('请输入取消原因');
      return;
    }
    await onStatusUpdate('已取消', {
      cancel_reason: cancelReason
    });
    setShowCancelForm(false);
  };
  const config = getActionConfig();
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
        <CardTitle className="text-white flex items-center">
          {config.icon}
          <span className="ml-3">{config.title}</span>
        </CardTitle>
        <p className="text-blue-100 mt-2">{config.description}</p>
      </CardHeader>
      <CardContent className="p-6">
        {/* 发货表单 */}
        {showShipForm && <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-3">填写物流信息</h4>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">物流公司</label>
              <Input value={logisticsCompany} onChange={e => setLogisticsCompany(e.target.value)} placeholder="请输入物流公司名称" className="w-full rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">物流单号</label>
              <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="请输入物流单号" className="w-full rounded-xl" />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleConfirmShip} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl px-6" disabled={loading}>
                {loading ? '处理中...' : '确认发货'}
              </Button>
              <Button variant="outline" onClick={() => setShowShipForm(false)} className="rounded-xl">
                取消
              </Button>
            </div>
          </div>}
        
        {/* 取消原因表单 */}
        {showCancelForm && <div className="space-y-4 mb-6 p-4 bg-red-50 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-3">填写取消原因</h4>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="请输入取消原因..." rows={3} className="w-full rounded-xl" />
            <div className="flex space-x-3">
              <Button onClick={handleConfirmCancel} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl px-6" disabled={loading}>
                {loading ? '处理中...' : '确认取消'}
              </Button>
              <Button variant="outline" onClick={() => setShowCancelForm(false)} className="rounded-xl">
                取消
              </Button>
            </div>
          </div>}
        
        {/* 操作按钮 */}
        {!showShipForm && !showCancelForm && <div className="flex flex-wrap gap-3">
            {config.actions.map((action, index) => <Button key={index} onClick={action.action} className={`${action.color} rounded-xl px-6 py-3 font-semibold`} disabled={loading}>
                {action.icon}
                {action.label}
              </Button>)}
          </div>}
      </CardContent>
    </Card>;
}