// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Input, Label, Textarea, Switch } from '@/components/ui';

// @ts-ignore
import { useForm } from 'react-hook-form';
// @ts-ignore

export function SettingsForm({
  title,
  description,
  children
}) {
  return <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
      {children}
    </div>;
}
export function ShopSettings() {
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    defaultValues: {
      shopName: '我的电商店铺',
      shopDescription: '专业的电子产品零售商',
      contactEmail: 'contact@shop.com',
      contactPhone: '400-123-4567',
      address: '北京市朝阳区xxx路xxx号',
      businessHours: '9:00-18:00'
    }
  });
  const onSubmit = data => {
    console.log('保存店铺设置:', data);
    alert('店铺设置已保存！');
  };
  return <SettingsForm title="店铺信息" description="配置您的店铺基本信息">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>店铺名称</Label>
          <Input {...register('shopName', {
          required: '店铺名称不能为空'
        })} />
          {errors.shopName && <p className="text-sm text-red-600 mt-1">{errors.shopName.message}</p>}
        </div>
        
        <div>
          <Label>店铺描述</Label>
          <Textarea {...register('shopDescription')} rows={3} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>联系邮箱</Label>
            <Input type="email" {...register('contactEmail', {
            required: '邮箱不能为空'
          })} />
          </div>
          
          <div>
            <Label>联系电话</Label>
            <Input {...register('contactPhone')} />
          </div>
        </div>
        
        <div>
          <Label>店铺地址</Label>
          <Input {...register('address')} />
        </div>
        
        <div>
          <Label>营业时间</Label>
          <Input {...register('businessHours')} />
        </div>
        
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          保存设置
        </Button>
      </form>
    </SettingsForm>;
}
export function AccountSettings() {
  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors
    }
  } = useForm({
    defaultValues: {
      username: 'admin',
      email: 'admin@shop.com',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  const newPassword = watch('newPassword');
  const onSubmit = data => {
    console.log('保存账户设置:', data);
    alert('账户设置已保存！');
  };
  return <SettingsForm title="账户设置" description="管理您的管理员账户">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>用户名</Label>
          <Input {...register('username', {
          required: '用户名不能为空'
        })} />
        </div>
        
        <div>
          <Label>邮箱</Label>
          <Input type="email" {...register('email', {
          required: '邮箱不能为空'
        })} />
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-3">修改密码</h4>
          
          <div className="space-y-4">
            <div>
              <Label>当前密码</Label>
              <Input type="password" {...register('currentPassword')} />
            </div>
            
            <div>
              <Label>新密码</Label>
              <Input type="password" {...register('newPassword', {
              minLength: {
                value: 6,
                message: '密码至少6位'
              }
            })} />
            </div>
            
            <div>
              <Label>确认密码</Label>
              <Input type="password" {...register('confirmPassword', {
              validate: value => value === newPassword || '两次输入的密码不一致'
            })} />
              {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
        </div>
        
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          保存更改
        </Button>
      </form>
    </SettingsForm>;
}
export function NotificationSettings() {
  const [notifications, setNotifications] = React.useState({
    orderNotifications: true,
    lowStockAlerts: true,
    newUserAlerts: false,
    marketingEmails: false,
    systemUpdates: true
  });
  const handleToggle = key => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const notificationOptions = [{
    key: 'orderNotifications',
    label: '订单通知',
    description: '新订单、订单状态变更时通知'
  }, {
    key: 'lowStockAlerts',
    label: '库存预警',
    description: '商品库存低于阈值时提醒'
  }, {
    key: 'newUserAlerts',
    label: '新用户注册',
    description: '有新用户注册时通知'
  }, {
    key: 'marketingEmails',
    label: '营销邮件',
    description: '接收产品更新和促销信息'
  }, {
    key: 'systemUpdates',
    label: '系统更新',
    description: '系统维护和更新通知'
  }];
  return <SettingsForm title="通知设置" description="配置您希望接收的通知类型">
      <div className="space-y-4">
        {notificationOptions.map(option => <div key={option.key} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="font-medium text-slate-900">{option.label}</p>
              <p className="text-sm text-slate-600">{option.description}</p>
            </div>
            <Switch checked={notifications[option.key]} onCheckedChange={() => handleToggle(option.key)} />
          </div>)}
        
        <Button onClick={() => {
        console.log('保存通知设置:', notifications);
        alert('通知设置已保存！');
      }} className="bg-blue-600 hover:bg-blue-700 mt-6">
          保存设置
        </Button>
      </div>
    </SettingsForm>;
}