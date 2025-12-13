// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Search, Plus, Download, Upload, Edit, Trash2, Eye, X } from 'lucide-react';
// @ts-ignore;
import { Button, Input, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

// @ts-ignore;
import { useDebounce } from '@/lib/useDebounce';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ProductTable } from '@/components/ProductTable';
import { Pagination } from '@/components/Pagination';
import { FilterPanel } from '@/components/FilterPanel';
export default function Products(props) {
  const {
    $w
  } = props;
  const [activePage, setActivePage] = React.useState('products');
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedProducts, setSelectedProducts] = React.useState([]);
  const [filters, setFilters] = React.useState({
    categories: [],
    tags: [],
    priceRange: [0, 1000],
    status: [],
    minRating: 0,
    stockStatus: []
  });
  const [deleteModal, setDeleteModal] = React.useState({
    isOpen: false,
    product: null
  });
  const itemsPerPage = 10;
  const [categories] = React.useState(['动漫手办', '机甲模型', '游戏周边', '电影周边']);
  const [tags] = React.useState(['限量版', '合金', '手办', '模型', '周边', '热门', '新品']);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const handleNavigate = pageId => {
    setActivePage(pageId);
    $w.utils.navigateTo({
      pageId,
      params: {}
    });
  };
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        getCount: true
      };
      const filterConditions = [];
      if (debouncedSearchTerm) {
        filterConditions.push({
          name: {
            $search: debouncedSearchTerm
          }
        });
      }
      if (filters.categories.length > 0) {
        filterConditions.push({
          category: {
            $in: filters.categories
          }
        });
      }
      if (filters.status.length > 0) {
        filterConditions.push({
          status: {
            $in: filters.status
          }
        });
      }
      if (filters.minRating > 0) {
        filterConditions.push({
          rating: {
            $gte: filters.minRating
          }
        });
      }
      if (filterConditions.length > 0) {
        params.filter = {
          where: {
            $and: filterConditions
          }
        };
      }
      const response = await $w.cloud.callDataSource({
        dataSourceName: 'pop_product',
        methodName: 'wedaGetRecordsV2',
        params
      });
      let filteredProducts = response.records || [];

      // 处理库存状态筛选
      if (filters.stockStatus.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const totalStock = product.specifications?.reduce((total, spec) => total + spec.stock, 0) || 0;
          return filters.stockStatus.some(status => {
            if (status === '有库存') return totalStock > 10;
            if (status === '低库存') return totalStock > 0 && totalStock <= 10;
            if (status === '无库存') return totalStock === 0;
            return false;
          });
        });
      }

      // 处理价格区间筛选
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        filteredProducts = filteredProducts.filter(product => {
          const lowestPrice = product.specifications?.length > 0 ? Math.min(...product.specifications.map(spec => spec.price)) : 0;
          return lowestPrice >= filters.priceRange[0] && lowestPrice <= filters.priceRange[1];
        });
      }
      setProducts(filteredProducts);
      setTotalItems(filteredProducts.length);
      setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage) || 1);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      // 使用模拟数据
      setProducts([{
        _id: '1',
        name: '初音未来 限量版手办',
        category: '动漫手办',
        status: '上架',
        main_image: 'https://images.unsplash.com/photo-1601814933824-fd0187ae6648?w=800&h=800&fit=crop',
        rating: 4.8,
        reviews: 128,
        tags: ['初音未来', '手办', '限量版'],
        specifications: [{
          name: '标准版',
          price: 299,
          original_price: 399,
          discount: 25,
          stock: 15,
          sku: 'MIKU-001'
        }, {
          name: '限量版',
          price: 399,
          original_price: 599,
          discount: 33,
          stock: 8,
          sku: 'MIKU-002'
        }]
      }, {
        _id: '2',
        name: 'EVA初号机 合金模型',
        category: '机甲模型',
        status: '上架',
        main_image: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=800&h=800&fit=crop',
        rating: 4.9,
        reviews: 256,
        tags: ['EVA', '初号机', '合金模型'],
        specifications: [{
          name: '标准版',
          price: 599,
          original_price: 699,
          discount: 14,
          stock: 20,
          sku: 'EVA-001'
        }]
      }]);
      setTotalItems(2);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, filters]);
  const handleFilterChange = newFilters => {
    setFilters(newFilters);
    setCurrentPage(1);
  };
  const handleResetFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      priceRange: [0, 1000],
      status: [],
      minRating: 0,
      stockStatus: []
    });
    setCurrentPage(1);
  };
  const handleAddProduct = () => {
    $w.utils.navigateTo({
      pageId: 'product-add',
      params: {}
    });
  };
  const handleEditProduct = product => {
    $w.utils.navigateTo({
      pageId: 'product-edit',
      params: {
        productId: product._id
      }
    });
  };
  const handleViewProduct = product => {
    $w.utils.navigateTo({
      pageId: 'product-detail',
      params: {
        productId: product._id
      }
    });
  };
  const handleDeleteProduct = product => {
    if (!product || !product._id) {
      alert('商品信息不完整，无法删除');
      return;
    }
    setDeleteModal({
      isOpen: true,
      product: product
    });
  };
  const confirmDelete = async () => {
    const product = deleteModal.product;
    if (!product || !product._id) return;
    try {
      const deleteParams = {
        dataSourceName: 'pop_product',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: product._id
              }
            }
          }
        }
      };
      console.log('删除商品参数:', deleteParams);
      await $w.cloud.callDataSource(deleteParams);
      // 删除成功后刷新列表
      await fetchProducts();
      setDeleteModal({
        isOpen: false,
        product: null
      });
    } catch (error) {
      console.error('删除商品失败:', error);
      alert(`删除商品失败: ${error.message || '请稍后重试'}`);
    }
  };
  const cancelDelete = () => {
    setDeleteModal({
      isOpen: false,
      product: null
    });
  };
  const handleSelectProduct = productId => {
    setSelectedProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };
  const handleSelectAll = checked => {
    if (checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };
  const handleBulkStatusChange = status => {
    if (selectedProducts.length === 0) return;
    console.log('批量更新状态:', status, selectedProducts);
  };
  return <div className="flex h-screen bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 ml-64">
        <Header user={$w.auth.currentUser} />
        <main className="mt-16 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">手办商品管理</h1>
              <p className="text-slate-600 mt-1">管理您的动漫手办商品</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2" size={16} />
                导出
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2" size={16} />
                导入
              </Button>
              <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2" size={20} />
                添加手办
              </Button>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <Input type="text" placeholder="搜索手办名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>

          {/* 筛选面板 */}
          <FilterPanel categories={categories} tags={tags} onFilterChange={handleFilterChange} currentFilters={filters} onReset={handleResetFilters} />

          {/* 筛选结果统计 */}
          {totalItems > 0 && <div className="mb-4 text-sm text-slate-600">
              共找到 {totalItems} 个商品
            </div>}

          {/* 商品表格 */}
          {loading ? <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">加载中...</span>
            </div> : <div>
              {products.length === 0 ? <div className="text-center py-12">
                  <div className="text-slate-500 mb-4">暂无符合条件的商品</div>
                  <Button onClick={handleResetFilters} variant="outline">
                    清除筛选条件
                  </Button>
                </div> : <div>
                  <ProductTable products={products} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onView={handleViewProduct} onStatusChange={handleBulkStatusChange} selectedProducts={selectedProducts} onSelectProduct={handleSelectProduct} onSelectAll={handleSelectAll} />
                  {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />}
                </div>}
            </div>}

          {/* 删除确认模态框 */}
          <Dialog open={deleteModal.isOpen} onOpenChange={setDeleteModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">确认删除商品</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  您确定要删除商品 "{deleteModal.product?.name}" 吗？此操作将永久删除该商品及其所有规格信息，且无法恢复。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelDelete}>
                  取消
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  确认删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>;
}