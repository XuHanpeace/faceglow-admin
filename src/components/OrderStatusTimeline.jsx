// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { CreditCard, CheckCircle, Package, Truck } from 'lucide-react';

export function OrderStatusTimeline({
  currentStatus
}) {
  const steps = [{
    status: '待付款',
    icon: <CreditCard className="w-5 h-5" />,
    label: '待付款'
  }, {
    status: '已付款',
    icon: <CheckCircle className="w-5 h-5" />,
    label: '已付款'
  }, {
    status: '待发货',
    icon: <Package className="w-5 h-5" />,
    label: '待发货'
  }, {
    status: '已发货',
    icon: <Truck className="w-5 h-5" />,
    label: '已发货'
  }, {
    status: '配送中',
    icon: <Truck className="w-5 h-5" />,
    label: '配送中'
  }, {
    status: '已送达',
    icon: <CheckCircle className="w-5 h-5" />,
    label: '已送达'
  }];
  const currentStepIndex = steps.findIndex(step => step.status === currentStatus);
  return <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">订单状态流程</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
        const isActive = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        return <div key={step.status} className="flex items-center">
            <div className={`flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${isActive ? 'bg-blue-100 scale-110' : 'bg-slate-100'}`}>
                {step.icon}
              </div>
              <span className="text-sm font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${isActive ? 'bg-blue-500' : 'bg-slate-200'}`} />}
          </div>;
      })}
      </div>
    </div>;
}