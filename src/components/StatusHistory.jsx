// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { History } from 'lucide-react';

export function StatusHistory({
  history
}) {
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500">
        <CardTitle className="text-white flex items-center">
          <History className="mr-2" size={20} />
          状态历史
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {history && history.length > 0 ? history.map((item, index) => <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-900">{item.status}</p>
                <p className="text-sm text-slate-600">{new Date(item.timestamp).toLocaleString('zh-CN')}</p>
                {item.note && <p className="text-sm text-slate-500 mt-1">{item.note}</p>}
              </div>
            </div>) : <p className="text-slate-500 text-center py-4">暂无状态变更记录</p>}
        </div>
      </CardContent>
    </Card>;
}