// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { ArrowLeft, Edit, Trash2, Star, Tag, Package, Clock, Eye, AlertCircle } from 'lucide-react';
// @ts-ignore;
import { Button, Badge, Card, CardContent } from '@/components/ui';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
export default function ProductDetail(props) {
  const {
    $w
  } = props;
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(0);
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
        if (response.image_gallery && response.image_gallery.length > 0) {
          setSelectedImage(0);
        }
      } else {
        setError('商品不存在或已被删除');
      }
    } catch (err) {
      console.error('获取商品详情失败:', err);
      setError(err.message || '获取商品详情失败，请稍后重试');
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
  const handleEdit = () => {
    if (!productId) return;
    $w.utils.navigateTo({
      pageId: 'product-edit',
      params: {
        productId
      }
    });
  };
  const handleDelete = async () => {
    if (!productId) {
      alert('商品ID无效，无法删除');
      return;
    }
    if (window.confirm('确定要删除这个商品吗？此操作不可恢复！')) {
      try {
        await $w.cloud.callDataSource({
          dataSourceName: 'pop_product',
          methodName: 'wedaDeleteV2',
          params: {
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
            success: 'delete'
          }
        });
      } catch (error) {
        console.error('删除商品失败:', error);
        alert('删除商品失败，请重试');
      }
    }
  };
  const handleBack = () => {
    $w.utils.navigateTo({
      pageId: 'products',
      params: {}
    });
  };
  const renderStars = rating => {
    return <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
        <span className="ml-2 text-sm text-gray-600">({rating || 0}分)</span>
      </div>;
  };
  if (loading) {
    return <div className="flex h-screen bg-slate-50">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        <div className="flex-1 ml-64">
          <Header user={$w.auth.currentUser} />
          <main className="mt-16 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">加载商品详情中...</span>
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
                  <Button onClick={handleBack} variant="outline">
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
  const allImages = [product.main_image, ...(product.image_gallery || [])].filter(Boolean);
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button onClick={handleBack} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回商品列表
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* 左侧：图片画廊 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  {/* 主图 */}
                  <div className="aspect-square bg-gray-100">
                    <img src={allImages[selectedImage] || 'https://via.placeholder.com/600x600?text=暂无图片'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* 缩略图 */}
                  {allImages.length > 1 && <div className="p-4">
                      <div className="grid grid-cols-4 gap-2">
                        {allImages.map((img, index) => <div key={index} className={`aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`} onClick={() => setSelectedImage(index)}>
                            <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                          </div>)}
                      </div>
                    </div>}
                </div>
              </div>
              
              {/* 右侧：商品信息 */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span className="flex items-center">
                            <Package className="w-4 h-4 mr-1" />
                            {product.category}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {product.status}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {product.reviews || 0} 次浏览
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button onClick={handleDelete} size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">商品评分</h3>
                        {renderStars(product.rating)}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">商品标签</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.tags?.map(tag => <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>)}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">商品描述</h3>
                        <p className="text-slate-600 leading-relaxed">{product.description || '暂无商品描述'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 规格信息 */}
                  {product.specifications && product.specifications.length > 0 && <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">商品规格</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.specifications.map((spec, index) => <div key={index} className="border border-slate-200 rounded-lg p-4">
                            <h4 className="font-medium text-slate-900 mb-2">{spec.name}</h4>
                            <div className="space-y-1 text-sm text-slate-600">
                              <div>原价：<span className="line-through text-slate-500">¥{spec.original_price}</span></div>
                              <div>折扣：<span className="font-medium">{spec.discount}%</span></div>
                              <div>折扣价：<span className="font-medium text-red-600">¥{spec.price}</span></div>
                              <div>库存：<span className="font-medium">{spec.stock}</span> 件</div>
                              <div>SKU：<span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{spec.sku}</span></div>
                            </div>
                          </div>)}
                      </div>
                    </div>}
                  
                  {/* 图片集 */}
                  {product.image_gallery && product.image_gallery.length > 0 && <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">商品图片集</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {product.image_gallery.map((img, index) => <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                            <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                          </div>)}
                      </div>
                    </div>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}