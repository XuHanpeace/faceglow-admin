// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Input, Label } from '@/components/ui';
// @ts-ignore;
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

// @ts-ignore
import { useForm } from 'react-hook-form';
// @ts-ignore

export default function Login(props) {
  const {
    $w
  } = props;
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });
  const onSubmit = async data => {
    setIsLoading(true);
    try {
      // 模拟登录验证
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 这里应该调用实际的登录API
      console.log('登录信息:', data);

      // 登录成功后跳转到仪表盘
      $w.utils.navigateTo({
        pageId: 'dashboard',
        params: {}
      });
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">电商后台管理</h1>
            <p className="text-slate-600 mt-2">请输入您的登录信息</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <Input id="email" type="email" placeholder="admin@example.com" className="pl-10" {...register('email', {
                required: '邮箱不能为空',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址'
                }
              })} />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" {...register('password', {
                required: '密码不能为空',
                minLength: {
                  value: 6,
                  message: '密码至少6位'
                }
              })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" {...register('rememberMe')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-slate-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                忘记密码？
              </a>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              测试账号: admin@example.com / 123456
            </p>
          </div>
        </div>
      </div>
    </div>;
}