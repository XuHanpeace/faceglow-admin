// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Home, Image, Database } from 'lucide-react';

export function Sidebar({
  activePage,
  onNavigate
}) {
  const menuItems = [{
    id: 'dashboard',
    label: '数据大盘',
    icon: Home
  }, {
    id: 'albums',
    label: '相册管理',
    icon: Database
  }, {
    id: 'batch-generate',
    label: '创建相册',
    icon: Image
  }, {
    id: 'workflow',
    label: '工作流创建',
    icon: Image
  }, {
    id: 'categories',
    label: '分类管理',
    icon: Database
  }];
  return <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0">
          <div className="p-6">
            <h1 className="text-xl font-bold text-white">FaceGlow 管理后台</h1>
          </div>
          <nav className="px-4">
            {menuItems.map(item => {
        const Icon = item.icon;
        return <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>;
      })}
          </nav>
        </div>;
}