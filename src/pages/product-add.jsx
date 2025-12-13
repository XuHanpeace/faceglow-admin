// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { ArrowLeft } from 'lucide-react';
// @ts-ignore;
import { Button } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ProductForm } from '@/components/ProductForm';
export default function ProductAdd(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('products');
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const handleSave = async productData => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'pop_product',
        methodName: 'wedaCreateV2',
        params: {
          data: productData
        }
      });
      $w.utils.navigateTo({
        pageId: 'products',
        params: {
          success: 'add'
        }
      });
    } catch (error) {
      console.error('添加商品失败:', error);
      alert('添加商品失败，请重试');
    }
  };
  const handleCancel = () => {
    $w.utils.navigateTo({
      pageId: 'products',
      params: {}
    });
  };
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6">
            <Button onClick={handleCancel} variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回商品列表
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">新增手办商品</h1>
            <p className="text-slate-600 mt-1">添加新的动漫手办到您的商店</p>
          </div>
          
          <ProductForm onSave={handleSave} onCancel={handleCancel} $w={$w} />
        </main>
      </div>
    </div>;
}