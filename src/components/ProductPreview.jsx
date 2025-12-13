// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Package, Tag, Star, Clock } from 'lucide-react';
// @ts-ignore;
import { Card, CardContent, Badge } from '@/components/ui';

export function ProductPreview({
  productData,
  imageGallery,
  specifications,
  mainImage
}) {
  const allImages = [mainImage, ...(imageGallery || [])].filter(Boolean);
  return <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
          <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">4</span>
          商品信息确认
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本信息 */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-900 mb-4">基本信息</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-600">商品名称：</span>
                  <span className="font-medium">{productData.name || '未设置'}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-600">商品分类：</span>
                  <span className="font-medium">{productData.category || '未设置'}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-600">商品状态：</span>
                  <Badge variant={productData.status === '上架' ? 'default' : 'secondary'}>
                    {productData.status || '未设置'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-slate-600">商品标签：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {productData.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 规格预览 */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-900 mb-4">商品规格</h4>
              <div className="space-y-3">
                {specifications.map((spec, index) => <div key={index} className="border border-slate-200 rounded-lg p-3">
                    <div className="font-medium text-slate-900 mb-2">{spec.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-600">原价：</span>
                        <span className="line-through">¥{spec.original_price || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">折扣：</span>
                        <span>{spec.discount || 0}%</span>
                      </div>
                      <div>
                        <span className="text-slate-600">折扣价：</span>
                        <span className="font-semibold text-red-600">¥{spec.price || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">库存：</span>
                        <span>{spec.stock || 0}</span>
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
          
          {/* 图片预览 */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-900 mb-4">商品图片</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {allImages.map((img, index) => <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                    <img src={img} alt={`商品图 ${index + 1}`} className="w-full h-full object-cover" />
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}