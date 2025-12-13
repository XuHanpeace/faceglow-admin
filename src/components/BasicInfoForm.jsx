// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Plus, X, Star } from 'lucide-react';
// @ts-ignore;
import { Input, Textarea, Badge, Button } from '@/components/ui';

// @ts-ignore;
import { useFormContext } from 'react-hook-form';
export function BasicInfoForm({
  selectedTags,
  setSelectedTags,
  availableTags
}) {
  const {
    register,
    formState: {
      errors
    },
    watch,
    setValue
  } = useFormContext();
  const [tagInput, setTagInput] = React.useState('');
  const categories = ['动漫手办', '机甲模型', '游戏周边', '电影周边'];
  const rating = watch('rating') || 0;
  const handleTagAdd = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags(prev => [...prev, tagInput]);
      setTagInput('');
    }
  };
  const removeTag = tag => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  const renderStars = () => {
    return <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" onClick={() => setValue('rating', star)} className={`p-1 rounded transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>
            <Star className="w-5 h-5 fill-current" />
          </button>)}
      </div>;
  };
  return <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
          基本信息
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              商品名称 <span className="text-red-500">*</span>
            </label>
            <Input {...register('name', {
            required: '商品名称不能为空'
          })} placeholder="请输入商品名称，如：初音未来 限量版手办" className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
            {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-1"></span>
                {errors.name.message}
              </p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              商品分类 <span className="text-red-500">*</span>
            </label>
            <select {...register('category', {
            required: '请选择商品分类'
          })} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">请选择分类</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-1"></span>
                {errors.category.message}
              </p>}
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">商品描述</label>
          <Textarea {...register('description')} rows={4} placeholder="请输入商品详细描述，包括材质、尺寸、特色等信息..." className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none" />
          <p className="text-xs text-slate-500 mt-1">支持详细描述商品特点、材质、尺寸等信息</p>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">商品评分</label>
          <div className="flex items-center space-x-3">
            {renderStars()}
            <span className="text-sm text-slate-600">{rating || 0} 分</span>
          </div>
          <input type="hidden" {...register('rating', {
          min: {
            value: 0,
            message: '评分不能小于0'
          },
          max: {
            value: 5,
            message: '评分不能大于5'
          }
        })} />
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">商品标签</label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTagAdd();
              }
            }} placeholder="输入标签后按回车添加" className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              <Button type="button" onClick={handleTagAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => <Badge key={tag} variant="secondary" className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-blue-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>)}
            </div>
            
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-slate-500 mr-2">快速添加：</span>
              {availableTags.filter(tag => !selectedTags.includes(tag)).map(tag => <Badge key={tag} variant="outline" className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all" onClick={() => setSelectedTags(prev => [...prev, tag])}>
                  {tag}
                </Badge>)}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">商品状态</label>
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer group">
              <input type="radio" {...register('status')} value="上架" className="mr-2 text-blue-600 focus:ring-blue-500" />
              <span className="group-hover:text-blue-600 transition-colors">上架销售</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input type="radio" {...register('status')} value="下架" className="mr-2 text-blue-600 focus:ring-blue-500" />
              <span className="group-hover:text-blue-600 transition-colors">暂不上架</span>
            </label>
          </div>
        </div>
      </div>
    </div>;
}