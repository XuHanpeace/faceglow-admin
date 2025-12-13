// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { Hash } from 'lucide-react';

export function OrderSummary({
  order
}) {
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500">
        <CardTitle className="text-white flex items-center">
          <Hash className="mr-2" size={20} />
          订单详情
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <span className="text-sm font-medium text-slate-600">订单号</span>
          <span className="text-sm font-mono font-semibold text-indigo-600">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <span className="text-sm font-medium text-slate-600">创建时间</span>
          <span className="text-sm text-slate-700">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <span className="text-sm font-medium text-slate-600">支付方式</span>
          <span className="text-sm text-slate-700">{order.paymentMethod}</span>
        </div>
        {order.trackingNumber && <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">物流单号</span>
            <span className="text-sm font-mono text-indigo-600">{order.trackingNumber}</span>
          </div>}
      </CardContent>
    </Card>;
}