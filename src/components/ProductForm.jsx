// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Save, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
// @ts-ignore;
import { Button } from '@/components/ui';

// @ts-ignore;
import { useForm, FormProvider } from 'react-hook-form';
import { BasicInfoForm } from '@/components/BasicInfoForm';
import { SpecificationsForm } from '@/components/SpecificationsForm';
import { ImageUploadForm } from '@/components/ImageUploadForm';
import { ProductPreview } from '@/components/ProductPreview';
import { StepIndicator } from '@/components/StepIndicator';
export function ProductForm({
  product,
  onSave,
  onCancel,
  $w
}) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [imageGallery, setImageGallery] = React.useState(product?.image_gallery || []);
  const [mainImage, setMainImage] = React.useState(product?.main_image || '');
  const [specifications, setSpecifications] = React.useState(product?.specifications || [{
    name: '',
    price: 0,
    stock: 0,
    sku: ''
  }]);
  const [selectedTags, setSelectedTags] = React.useState(product?.tags || []);
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [imageFiles, setImageFiles] = React.useState({
    main: null,
    gallery: []
  });
  const [galleryFileMap, setGalleryFileMap] = React.useState({});
  const availableTags = ['限量版', '合金', '手办', '模型', '周边', '热门', '新品', '预售', '现货'];
  const methods = useForm({
    defaultValues: product || {
      name: '',
      category: '',
      description: '',
      tags: [],
      status: '上架',
      main_image: '',
      rating: 0,
      reviews: 0
    }
  });
  const handleImageChange = (type, file, blobUrl) => {
    if (type === 'main') {
      setImageFiles(prev => ({
        ...prev,
        main: file
      }));
      setMainImage(blobUrl);
    } else if (type === 'gallery') {
      const newFiles = Array.isArray(file) ? file : [file];
      const newBlobUrls = Array.isArray(blobUrl) ? blobUrl : [blobUrl];

      // 更新图集
      setImageGallery(prev => [...prev, ...newBlobUrls]);

      // 为每个新blob URL创建文件映射
      const newFileMap = {};
      newBlobUrls.forEach((blobUrl, index) => {
        newFileMap[blobUrl] = newFiles[index];
      });
      setGalleryFileMap(prev => ({
        ...prev,
        ...newFileMap
      }));
    }
  };
  const uploadImageToCloud = async file => {
    if (!file) return '';
    const cloud = await $w.cloud.getCloudInstance();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop().toLowerCase();
    const safeFileName = `product_${timestamp}_${randomStr}.${extension}`;
    const cloudPath = `project/product_images/${safeFileName}`;
    const result = await cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: file
    });
    return result.fileID;
  };
  const uploadImages = async () => {
    const uploadedData = {
      main_image: mainImage,
      image_gallery: [...imageGallery]
    };
    const filesToUpload = [];
    // 处理主图
    if (imageFiles.main && mainImage.startsWith('blob:')) {
      filesToUpload.push({
        type: 'main',
        file: imageFiles.main,
        blobUrl: mainImage
      });
    }
    // 处理图集 - 使用映射方式处理所有blob URL
    imageGallery.forEach((img, index) => {
      if (img.startsWith('blob:')) {
        const file = galleryFileMap[img];
        if (file) {
          filesToUpload.push({
            type: 'gallery',
            file,
            index
          });
        }
      }
    });
    if (filesToUpload.length === 0) {
      return uploadedData;
    }
    // 批量上传
    setUploadProgress(0);
    for (let i = 0; i < filesToUpload.length; i++) {
      const item = filesToUpload[i];
      const fileID = await uploadImageToCloud(item.file);
      if (item.type === 'main') {
        uploadedData.main_image = fileID;
      } else {
        uploadedData.image_gallery[item.index] = fileID;
      }
      setUploadProgress((i + 1) / filesToUpload.length * 100);
    }
    return uploadedData;
  };
  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    try {
      const data = methods.getValues();
      // 上传图片到云存储
      const uploadedImages = await uploadImages();
      const productData = {
        ...data,
        tags: selectedTags,
        main_image: uploadedImages.main_image,
        image_gallery: uploadedImages.image_gallery,
        specifications: specifications.filter(spec => spec.name && spec.price > 0)
      };
      await onSave(productData);
    } catch (error) {
      console.error('保存商品失败:', error);
      alert('保存商品失败，请重试');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };
  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoForm selectedTags={selectedTags} setSelectedTags={setSelectedTags} availableTags={availableTags} />;
      case 2:
        return <SpecificationsForm specifications={specifications} setSpecifications={setSpecifications} />;
      case 3:
        return <ImageUploadForm imageGallery={imageGallery} setImageGallery={setImageGallery} mainImage={mainImage} setMainImage={setMainImage} onImageChange={handleImageChange} />;
      case 4:
        return <ProductPreview productData={methods.watch()} imageGallery={imageGallery} specifications={specifications} mainImage={mainImage} />;
      default:
        return null;
    }
  };
  return <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <StepIndicator currentStep={currentStep} totalSteps={4} />
          
          {/* 上传进度条 */}
          {isSaving && uploadProgress > 0 && <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">正在上传图片...</span>
                <span className="text-sm text-blue-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
              width: `${uploadProgress}%`
            }}></div>
              </div>
            </div>}
          
          {/* 步骤标题 */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-900">
                {currentStep === 1 && '基本信息设置'}
                {currentStep === 2 && '商品规格配置'}
                {currentStep === 3 && '商品图片上传'}
                {currentStep === 4 && '商品信息确认'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {currentStep === 1 && '设置商品的基本信息和分类'}
                {currentStep === 2 && '配置商品的规格、价格和库存'}
                {currentStep === 3 && '上传商品的主图和详情图片'}
                {currentStep === 4 && '确认商品信息并保存'}
              </p>
            </div>
          </div>
          
          {/* 表单内容 */}
          <div className="p-6">
            {renderCurrentStep()}
          </div>
          
          {/* 操作按钮 */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div>
              {currentStep > 1 && <Button type="button" onClick={prevStep} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" disabled={isSaving}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一步
                </Button>}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button type="button" onClick={onCancel} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" disabled={isSaving}>
                取消
              </Button>
              
              {currentStep < 4 ? <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button> : <Button type="button" onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  {isSaving ? '保存中...' : '保存商品'}
                </Button>}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>;
}