// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { ShoppingBag } from 'lucide-react';

export function OrderItemsList({
  items,
  totalAmount
}) {
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500">
        <CardTitle className="text-white flex items-center">
          <ShoppingBag className="mr-2" size={20} />
          商品信息
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {items.map((item, index) => <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
              <img src={item.product_image || 'https://images.unsplash.com/photo-1601814933824-fd0187ae6648?w=100&h=100&fit=crop'} alt={item.product_name} className="w-20 h-20 rounded-xl object-cover shadow-md" />
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 text-lg">{item.product_name}</h4>
                <p className="text-sm text-slate-600 mt-1">{item.version || item.specification}</p>
                <p className="text-sm text-slate-500 mt-1">数量: <span className="font-semibold">{item.quantity}</span></p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 text-lg">¥{item.subtotal}</p>
                <p className="text-sm text-slate-500">单价: ¥{item.price}</p>
              </div>
            </div>)}
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl">
            <span className="text-xl font-bold text-slate-900">总计金额</span>
            <span className="text-2xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>;
}