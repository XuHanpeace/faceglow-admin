// @ts-ignore;
import React from 'react';

export function StepIndicator({
  currentStep,
  totalSteps
}) {
  const steps = [{
    number: 1,
    title: '基本信息',
    description: '设置商品的基本信息和分类'
  }, {
    number: 2,
    title: '商品规格',
    description: '配置商品的规格、价格和库存'
  }, {
    number: 3,
    title: '商品图片',
    description: '上传商品的主图和详情图片'
  }, {
    number: 4,
    title: '商品确认',
    description: '确认商品信息并保存'
  }];
  return <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">商品管理</h2>
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => <div key={step.number} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep >= step.number ? 'bg-white text-blue-600' : 'bg-blue-500 text-white bg-opacity-50'}`}>
                {step.number}
              </div>
              {index < steps.length - 1 && <div className={`w-8 h-0.5 mx-2 ${currentStep > step.number ? 'bg-white' : 'bg-blue-400'}`}></div>}
            </div>)}
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <h3 className="text-lg font-medium text-white">
          {steps[currentStep - 1]?.title}
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          {steps[currentStep - 1]?.description}
        </p>
      </div>
    </div>;
}