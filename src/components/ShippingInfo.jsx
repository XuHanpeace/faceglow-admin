// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { MapPin, User, Phone } from 'lucide-react';

export function ShippingInfo({
  shippingAddress
}) {
  const address = shippingAddress ? `${shippingAddress.province || ''}${shippingAddress.city || ''}${shippingAddress.district || ''}${shippingAddress.detail || ''}` : '地址未填写';
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500">
        <CardTitle className="text-white flex items-center">
          <MapPin className="mr-2" size={20} />
          收货信息
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <User className="mr-3 text-orange-500" size={20} />
          <div>
            <span className="font-semibold text-slate-900">{shippingAddress?.name || '匿名用户'}</span>
          </div>
        </div>
        <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <Phone className="mr-3 text-orange-500" size={20} />
          <span className="text-slate-700">{shippingAddress?.phone || '未填写'}</span>
        </div>
        <div className="flex items-start p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <MapPin className="mr-3 text-orange-500 mt-1" size={20} />
          <span className="text-slate-700 text-sm leading-relaxed">{address}</span>
        </div>
      </CardContent>
    </Card>;
}