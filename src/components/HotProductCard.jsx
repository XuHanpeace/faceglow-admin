// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Star, Eye } from 'lucide-react';
// @ts-ignore;
import { Button, Badge } from '@/components/ui';

export function HotProductCard({
  product,
  onViewDetail
}) {
  const getLowestPrice = specifications => {
    if (!specifications || specifications.length === 0) return 0;
    return Math.min(...specifications.map(spec => spec.price));
  };
  const lowestPrice = getLowestPrice(product.specifications);
  return <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetail(product)}>
      <div className="aspect-square relative">
        <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
        <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
          热销
        </Badge>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">{product.name}</h3>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
          </div>
          <span className="text-xs text-slate-600 ml-1">({product.reviews || 0})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-red-600">¥{lowestPrice}</span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            查看
          </Button>
        </div>
      </div>
    </div>;
}