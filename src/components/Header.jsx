// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Bell, Search, User } from 'lucide-react';
// @ts-ignore;
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui';

export function Header({
  user,
  title
}) {
  const pageTitles = {
    'dashboard': '数据大盘',
    'albums': '相册管理',
    'batch-generate': '批量生产',
    'categories': '分类管理',
    'products': '商品管理',
    'orders': '订单管理',
    'users': '用户管理',
    'analytics': '数据分析',
    'settings': '系统设置',
  }
  
  const getPageTitle = () => {
    if (title) return title
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/', '') || 'dashboard'
      return pageTitles[path] || '仪表盘'
    }
    return '仪表盘'
  }
  
  const pageTitle = getPageTitle()
  
  return <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-10">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-slate-800">{pageTitle}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="搜索..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button variant="ghost" size="icon">
                <Bell size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>;
}