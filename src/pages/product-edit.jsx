// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { ArrowLeft, Save, X, Loader2, AlertCircle } from 'lucide-react';
// @ts-ignore;
import { Button, Alert, AlertDescription, AlertTitle } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ProductForm } from '@/components/ProductForm';
export default function ProductEdit(props) {
  const {
    $w
  } = props;
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activePage, setActivePage] = React.useState('products');

  // 获取商品ID，支持多种参数格式
  const getProductId = () => {
    const params = $w.page.dataset.params || {};
    return params.productId || params.id || params.product_id;
  };
  const productId = getProductId();
  React.useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      setError('缺少商品ID参数，请从商品列表进入');
      setLoading(false);
    }
  }, [productId]);
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await $w.cloud.callDataSource({
        dataSourceName: 'pop_product',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: productId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (response) {
        setProduct(response);
      } else {
        setError('商品不存在或已被删除');
      }
    } catch (err) {
      console.error('获取商品信息失败:', err);
      setError(err.message || '获取商品信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const handleSave = async productData => {
    if (!productId) {
      alert('商品ID无效，无法更新');
      return;
    }
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'pop_product',
        methodName: 'wedaUpdateV2',
        params: {
          data: productData,
          filter: {
            where: {
              _id: {
                $eq: productId
              }
            }
          }
        }
      });
      $w.utils.navigateTo({
        pageId: 'products',
        params: {
          success: 'update'
        }
      });
    } catch (err) {
      console.error('更新商品失败:', err);
      alert('更新商品失败，请重试');
    }
  };
  const handleCancel = () => {
    $w.utils.navigateTo({
      pageId: 'products',
      params: {}
    });
  };
  if (loading) {
    return <div className="flex h-screen bg-slate-50">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">加载商品信息中...</span>
            </div>
          </main>
        </div>
      </div>;
  }
  if (error || !productId) {
    return <div className="flex h-screen bg-slate-50">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">加载失败</h2>
                <p className="text-slate-600 mb-6">{error || '缺少商品ID参数，请从商品列表进入'}</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleCancel} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回商品列表
                  </Button>
                  {productId && <Button onClick={fetchProduct} variant="outline">
                    重新加载
                  </Button>}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>;
  }
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button onClick={handleCancel} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回商品列表
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">编辑商品</h1>
                <p className="text-sm text-slate-600 mt-1">修改商品信息和设置</p>
              </div>
              
              <div className="p-6">
                <ProductForm product={product} onSave={handleSave} onCancel={handleCancel} $w={$w} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}