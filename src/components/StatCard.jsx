// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon
}) {
  const isPositive = changeType === 'up';
  return <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {isPositive ? <TrendingUp className="text-green-500" size={16} /> : <TrendingDown className="text-red-500" size={16} />}
            <span className={`text-sm ml-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
            <span className="text-sm text-slate-500 ml-1">vs last month</span>
          </div>
        </div>;
}