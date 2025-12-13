// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
// @ts-ignore;
import { Button, Badge, Slider, Checkbox } from '@/components/ui';

export function FilterPanel({
  categories,
  tags,
  onFilterChange,
  currentFilters,
  onReset
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState(currentFilters.categories || []);
  const [selectedTags, setSelectedTags] = React.useState(currentFilters.tags || []);
  const [priceRange, setPriceRange] = React.useState(currentFilters.priceRange || [0, 1000]);
  const [selectedStatus, setSelectedStatus] = React.useState(currentFilters.status || []);
  const [minRating, setMinRating] = React.useState(currentFilters.minRating || 0);
  const [stockStatus, setStockStatus] = React.useState(currentFilters.stockStatus || []);
  const handleCategoryChange = category => {
    const newCategories = selectedCategories.includes(category) ? selectedCategories.filter(c => c !== category) : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    onFilterChange({
      ...currentFilters,
      categories: newCategories
    });
  };
  const handleTagChange = tag => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag];
    setSelectedTags(newTags);
    onFilterChange({
      ...currentFilters,
      tags: newTags
    });
  };
  const handleStatusChange = status => {
    const newStatus = selectedStatus.includes(status) ? selectedStatus.filter(s => s !== status) : [...selectedStatus, status];
    setSelectedStatus(newStatus);
    onFilterChange({
      ...currentFilters,
      status: newStatus
    });
  };
  const handleStockStatusChange = status => {
    const newStockStatus = stockStatus.includes(status) ? stockStatus.filter(s => s !== status) : [...stockStatus, status];
    setStockStatus(newStockStatus);
    onFilterChange({
      ...currentFilters,
      stockStatus: newStockStatus
    });
  };
  const handlePriceChange = value => {
    setPriceRange(value);
    onFilterChange({
      ...currentFilters,
      priceRange: value
    });
  };
  const handleRatingChange = value => {
    setMinRating(value);
    onFilterChange({
      ...currentFilters,
      minRating: value
    });
  };
  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setPriceRange([0, 1000]);
    setSelectedStatus([]);
    setMinRating(0);
    setStockStatus([]);
    onReset();
  };
  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000 || selectedStatus.length > 0 || minRating > 0 || stockStatus.length > 0;
  return <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-slate-600 mr-2" />
          <span className="font-medium text-slate-900">筛选条件</span>
          {hasActiveFilters && <Badge variant="secondary" className="ml-2">
              已启用
            </Badge>}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={handleReset}>
              重置
            </Button>}
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-slate-100 rounded">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {isExpanded && <div className="p-6 space-y-6">
          {/* 已选筛选条件标签 */}
          {hasActiveFilters && <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <button onClick={() => handleCategoryChange(category)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>)}
              {selectedTags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button onClick={() => handleTagChange(tag)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>)}
              {selectedStatus.map(status => <Badge key={status} variant="secondary" className="text-xs">
                  {status}
                  <button onClick={() => handleStatusChange(status)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>)}
              {stockStatus.map(status => <Badge key={status} variant="secondary" className="text-xs">
                  {status}
                  <button onClick={() => handleStockStatusChange(status)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>)}
              {minRating > 0 && <Badge variant="secondary" className="text-xs">
                  评分 ≥ {minRating}
                  <button onClick={() => handleRatingChange(0)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>}
              {priceRange[0] > 0 || priceRange[1] < 1000 && <Badge variant="secondary" className="text-xs">
                  ¥{priceRange[0]} - ¥{priceRange[1]}
                  <button onClick={() => handlePriceChange([0, 1000])} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>}
            </div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 分类筛选 */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">商品分类</h4>
              <div className="space-y-2">
                {categories.map(category => <label key={category} className="flex items-center">
                    <Checkbox checked={selectedCategories.includes(category)} onCheckedChange={() => handleCategoryChange(category)} />
                    <span className="ml-2 text-sm text-slate-700">{category}</span>
                  </label>)}
              </div>
            </div>
            
            {/* 标签筛选 */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">商品标签</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tags.map(tag => <label key={tag} className="flex items-center">
                    <Checkbox checked={selectedTags.includes(tag)} onCheckedChange={() => handleTagChange(tag)} />
                    <span className="ml-2 text-sm text-slate-700">{tag}</span>
                  </label>)}
              </div>
            </div>
            
            {/* 价格区间 */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">价格区间</h4>
              <div className="space-y-2">
                <Slider value={priceRange} onValueChange={handlePriceChange} min={0} max={1000} step={50} className="w-full" />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>¥{priceRange[0]}</span>
                  <span>¥{priceRange[1]}</span>
                </div>
              </div>
            </div>
            
            {/* 其他筛选 */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">其他条件</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-700">商品状态</label>
                  <div className="space-y-1 mt-1">
                    {['上架', '下架'].map(status => <label key={status} className="flex items-center">
                        <Checkbox checked={selectedStatus.includes(status)} onCheckedChange={() => handleStatusChange(status)} />
                        <span className="ml-2 text-sm text-slate-600">{status}</span>
                      </label>)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-slate-700">库存状态</label>
                  <div className="space-y-1 mt-1">
                    {['有库存', '低库存', '无库存'].map(status => <label key={status} className="flex items-center">
                        <Checkbox checked={stockStatus.includes(status)} onCheckedChange={() => handleStockStatusChange(status)} />
                        <span className="ml-2 text-sm text-slate-600">{status}</span>
                      </label>)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-slate-700">最低评分</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider value={[minRating]} onValueChange={([value]) => handleRatingChange(value)} min={0} max={5} step={0.5} className="flex-1" />
                    <span className="text-sm text-slate-600 w-8">{minRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}