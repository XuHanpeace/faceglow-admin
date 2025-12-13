// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui';
// @ts-ignore;
import { Search } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
export default function Users(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('users');
  const users = [{
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '138****1234',
    orders: 12,
    totalSpent: 3599.88,
    joinDate: '2023-01-15'
  }, {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    phone: '139****5678',
    orders: 8,
    totalSpent: 2199.92,
    joinDate: '2023-02-20'
  }, {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    phone: '137****9012',
    orders: 15,
    totalSpent: 4599.85,
    joinDate: '2023-03-10'
  }, {
    id: 4,
    name: '赵六',
    email: 'zhaoliu@example.com',
    phone: '136****3456',
    orders: 5,
    totalSpent: 1299.95,
    joinDate: '2023-04-05'
  }];
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  return <div className="flex h-screen bg-slate-50">
          <Sidebar activePage={activePage} onNavigate={handleNavigate} />
          <div className="flex-1 ml-64">
            <Header user={$w.auth.currentUser} />
            <main className="mt-16 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
                  <p className="text-slate-600 mt-1">管理您的用户信息和订单记录</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input type="text" placeholder="搜索用户..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">用户</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">联系方式</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">订单数</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">总消费</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">注册日期</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{user.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{user.orders}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">¥{user.totalSpent}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{user.joinDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">查看</Button>
                              <Button variant="ghost" size="sm">编辑</Button>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>
        </div>;
}