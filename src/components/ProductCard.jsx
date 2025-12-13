// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Star, ShoppingCart, Eye } from 'lucide-react';
// @ts-ignore;
import { Card, CardContent, CardFooter, Badge, Button } from '@/components/ui';

export function ProductCard({
  product,
  onView,
  onEdit
}) {
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
  const lowestPrice = getLowestPrice(product.specifications);
  const originalPrice = getOriginalPrice(product.specifications);
  const totalStock = getTotalStock(product.specifications);
  return <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square relative">
        <img src={product.main_image || 'https://via.placeholder.com/300x300?text=暂无图片'} alt={product.name} className="w-full h-full object-cover" />
        {product.status === '下架' && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">已下架</Badge>
          </div>}
        <div className="absolute top-2 right-2 flex space-x-1">
          {product.tags?.slice(0, 2).map(tag => <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>)}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
          </div>
          <span className="ml-1 text-sm text-slate-600">({product.rating || 0})</span>
        </div>
        
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-xl font-bold text-red-600">¥{lowestPrice}</span>
          {originalPrice > lowestPrice && <span className="text-sm text-slate-500 line-through">¥{originalPrice}</span>}
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>库存: {totalStock}</span>
          <span className="text-xs">{product.category}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex space-x-2">
        <Button onClick={() => onView(product._id)} variant="outline" size="sm" className="flex-1">
          <Eye className="w-4 h-4 mr-1" />
          查看
        </Button>
        <Button onClick={() => onEdit(product._id)} size="sm" className="flex-1">
          编辑
        </Button>
      </CardFooter>
    </Card>;
}