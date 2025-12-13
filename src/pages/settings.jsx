// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Settings as SettingsIcon, Bell, User, Store } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ShopSettings, AccountSettings, NotificationSettings } from '@/components/SettingsForm';
export default function SettingsPage(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('settings');
  const [activeTab, setActiveTab] = React.useState('shop');
  const tabs = [{
    id: 'shop',
    label: '店铺设置',
    icon: Store
  }, {
    id: 'account',
    label: '账户设置',
    icon: User
  }, {
    id: 'notifications',
    label: '通知设置',
    icon: Bell
  }];
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'shop':
        return <ShopSettings />;
      case 'account':
        return <AccountSettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <ShopSettings />;
    }
  };
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
            <p className="text-slate-600 mt-1">配置您的店铺和管理设置</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-slate-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map(tab => {
                const Icon = tab.icon;
                return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>;
              })}
              </nav>
            </div>
            
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>;
}