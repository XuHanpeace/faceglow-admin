// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Plus, Trash2, Percent } from 'lucide-react';
// @ts-ignore;
import { Button, Input, Label } from '@/components/ui';

export function SpecificationsForm({
  specifications,
  setSpecifications
}) {
  const addSpecification = () => {
    setSpecifications([...specifications, {
      name: '',
      original_price: 0,
      discount: 0,
      price: 0,
      stock: 0,
      sku: ''
    }]);
  };
  const removeSpecification = index => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };
  const updateSpecification = (index, field, value) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: value
    };
    // 自动计算折扣价
    if (field === 'original_price' || field === 'discount') {
      const originalPrice = field === 'original_price' ? value : updatedSpecs[index].original_price;
      const discount = field === 'discount' ? value : updatedSpecs[index].discount;
      if (originalPrice > 0 && discount >= 0 && discount <= 100) {
        updatedSpecs[index].price = Math.round(originalPrice * (1 - discount / 100));
      }
    }
    setSpecifications(updatedSpecs);
  };
  return <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
          商品规格配置
        </h3>
        
        <div className="space-y-4">
          {specifications.map((spec, index) => <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900">规格 {index + 1}</h4>
                {specifications.length > 1 && <Button type="button" onClick={() => removeSpecification(index)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">规格名称</Label>
                  <Input type="text" value={spec.name} onChange={e => updateSpecification(index, 'name', e.target.value)} placeholder="如：标准版、豪华版" className="mt-1" />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">SKU编码</Label>
                  <Input type="text" value={spec.sku} onChange={e => updateSpecification(index, 'sku', e.target.value)} placeholder="商品SKU" className="mt-1" />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">原价 (¥)</Label>
                  <Input type="number" value={spec.original_price || ''} onChange={e => updateSpecification(index, 'original_price', Number(e.target.value))} placeholder="0" min="0" className="mt-1" />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">折扣 (%)</Label>
                  <div className="relative mt-1">
                    <Input type="number" value={spec.discount || ''} onChange={e => updateSpecification(index, 'discount', Math.min(100, Math.max(0, Number(e.target.value))))} placeholder="0-100" min="0" max="100" className="pr-8" />
                    <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">折扣价 (¥)</Label>
                  <Input type="number" value={spec.price || ''} readOnly className="mt-1 bg-slate-50 text-red-600 font-semibold" />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700">库存数量</Label>
                  <Input type="number" value={spec.stock || ''} onChange={e => updateSpecification(index, 'stock', Number(e.target.value))} placeholder="0" min="0" className="mt-1" />
                </div>
              </div>
              
              {spec.original_price > 0 && spec.discount > 0 && <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="line-through text-slate-500">¥{spec.original_price}</span>
                    <span className="ml-2 font-semibold">¥{spec.price}</span>
                    <span className="ml-2 text-green-600">({spec.discount}% 折扣)</span>
                  </p>
                </div>}
            </div>)}
          
          <Button type="button" onClick={addSpecification} variant="outline" className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" />
            添加规格
          </Button>
        </div>
      </div>
    </div>;
}