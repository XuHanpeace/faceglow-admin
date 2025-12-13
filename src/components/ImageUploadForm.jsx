// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Plus, X, Upload } from 'lucide-react';
// @ts-ignore;
import { Button } from '@/components/ui';

export function ImageUploadForm({
  imageGallery,
  setImageGallery,
  mainImage,
  setMainImage,
  onImageChange
}) {
  const handleMainImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setMainImage(blobUrl);
      onImageChange && onImageChange('main', file, blobUrl);
    }
  };
  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newBlobUrls = files.map(file => URL.createObjectURL(file));
    onImageChange && onImageChange('gallery', files, newBlobUrls);
  };
  const removeMainImage = () => {
    setMainImage('');
    onImageChange && onImageChange('main', null, '');
  };
  const removeGalleryImage = index => {
    setImageGallery(prev => prev.filter((_, i) => i !== index));
  };
  return <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
          <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
          商品图片
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              商品主图 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" id="main-image-upload" />
              <label htmlFor="main-image-upload" className="cursor-pointer block">
                {mainImage ? <div className="relative group">
                    <img src={mainImage} alt="主图预览" className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-purple-200" />
                    <button type="button" onClick={removeMainImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div> : <div className="space-y-3">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">点击上传主图</p>
                      <p className="text-xs text-slate-500 mt-1">支持 JPG、PNG 格式</p>
                    </div>
                  </div>}
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              商品图片集
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {imageGallery.map((img, index) => <div key={index} className="relative group">
                    <img src={img} alt={`商品图 ${index + 1}`} className="w-full h-20 object-cover rounded-lg border-2 border-slate-200 group-hover:border-purple-300 transition-colors" />
                    <button type="button" onClick={() => removeGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>)}
                
                <label className="border-2 border-dashed border-slate-300 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-purple-600" />
                </label>
              </div>
              <p className="text-xs text-slate-500">可上传多张图片展示商品细节</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}