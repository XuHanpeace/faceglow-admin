// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Badge, Button } from '@/components/ui';

export function OrderTable({
  orders
}) {
  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  return <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">最近订单</h3>
          </div>
          <div className="overflow-x-auto">
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
                    <td className="px-6 py-4 text-sm text-slate-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">¥{order.amount}</td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.date}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">查看</Button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>;
}