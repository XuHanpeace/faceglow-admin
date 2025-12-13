// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Eye, Edit, Trash2, Package, ChevronDown, ChevronUp } from 'lucide-react';
// @ts-ignore;
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button } from '@/components/ui';

export function ProductTable({
  products,
  onView,
  onEdit,
  onDelete
}) {
  const [expandedRows, setExpandedRows] = React.useState(new Set());
  const toggleRow = productId => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };
  const getLowestPrice = specifications => {
    if (!specifications || specifications.length === 0) return 0;
    return Math.min(...specifications.map(spec => spec.price || 0));
  };
  const getOriginalPrice = specifications => {
    if (!specifications || specifications.length === 0) return 0;
    return Math.max(...specifications.map(spec => spec.original_price || 0));
  };
  const getTotalStock = specifications => {
    if (!specifications || specifications.length === 0) return 0;
    return specifications.reduce((sum, spec) => sum + (spec.stock || 0), 0);
  };
  const getStockStatus = stock => {
    if (stock === 0) return {
      label: '无库存',
      color: 'destructive'
    };
    if (stock <= 10) return {
      label: '低库存',
      color: 'warning'
    };
    return {
      label: '有库存',
      color: 'default'
    };
  };
  return <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">图片</TableHead>
            <TableHead>商品信息</TableHead>
            <TableHead>价格区间</TableHead>
            <TableHead>总库存</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => {
          const lowestPrice = getLowestPrice(product.specifications);
          const originalPrice = getOriginalPrice(product.specifications);
          const totalStock = getTotalStock(product.specifications);
          const hasSpecifications = product.specifications && product.specifications.length > 0;
          const isExpanded = expandedRows.has(product._id);
          return <React.Fragment key={product._id}>
              {/* 主行 */}
              <TableRow>
                <TableCell>
                  <img src={product.main_image || 'https://via.placeholder.com/50x50?text=图'} alt={product.name} className="w-12 h-12 object-cover rounded" />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-slate-600">{product.category}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.tags?.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-semibold text-red-600">¥{lowestPrice}</div>
                    {originalPrice > lowestPrice && <div className="text-sm text-slate-500 line-through">¥{originalPrice}</div>}
                    {hasSpecifications && <Button variant="ghost" size="sm" className="text-xs p-0 h-auto" onClick={() => toggleRow(product._id)}>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {product.specifications.length}个版本
                      </Button>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{totalStock}</span>
                    <Badge variant={getStockStatus(totalStock).color} className="text-xs">
                      {getStockStatus(totalStock).label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === '上架' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button onClick={() => onView(product)} variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => onEdit(product)} variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => onDelete(product)} variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              
              {/* 展开行 - 规格详情 */}
              {isExpanded && hasSpecifications && <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <div className="bg-slate-50 p-4 border-t border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">商品规格详情</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.specifications.map((spec, index) => {
                      const stockStatus = getStockStatus(spec.stock);
                      return <div key={index} className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-slate-900">{spec.name}</h5>
                              <Badge variant={stockStatus.color} className="text-xs">
                                {stockStatus.label}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">原价:</span>
                                <span className="line-through text-slate-500">¥{spec.original_price}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">折扣:</span>
                                <span className="text-blue-600">{spec.discount}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">折扣价:</span>
                                <span className="font-semibold text-red-600">¥{spec.price}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">库存:</span>
                                <span className="font-medium">{spec.stock} 件</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">SKU:</span>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{spec.sku}</span>
                              </div>
                            </div>
                          </div>;
                    })}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>}
            </React.Fragment>;
        })}
        </TableBody>
      </Table>
    </div>;
}