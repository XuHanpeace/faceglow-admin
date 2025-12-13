# FaceGlow 管理后台功能

## 已集成的功能

### 1. 数据大盘 (`/dashboard`)
- 页面PV/UV统计
- APP PV/UV统计
- 新用户注册（按天维度）
- Album点击创作PV/UV
- 自定义上报错误报表

### 2. 相册管理 (`/albums`)
- 查看所有相册列表
- 显示封面缩略图
- 查看和编辑标签（主题风格、活动标签）
- 上线/下线控制
- 删除相册

### 3. 批量生产 (`/batch-generate`)
- 选择或新增Category
- 输入多条Prompt文本
- 调用百炼文生图生成封面
- 选择封面并打标签
- 上传到数据库

## 技术栈

- React 18
- TypeScript
- Vite
- Ant Design (用于新页面)
- shadcn/ui (用于原有页面)
- 腾讯云开发

## 运行

```bash
cd /Users/hanksxu/Desktop/project/faceglow-admin
npm install --legacy-peer-deps
npm run dev
```

访问 http://localhost:8080

## 云函数

所有云函数统一维护在：
```
/Users/hanksxu/Desktop/project/cloud-func/functions/
```

包括：
- `generateImages` - 百炼文生图
- `queryTaskWithoutToken` - 查询任务状态
- `uploadToCOS` - 上传到COS
- `callRUMAPI` - 调用RUM API
- `getAlbumList` - 获取相册列表
- `getCategoryConfig` - 获取分类配置

## 注意事项

1. 新页面使用 Ant Design，原有页面使用 shadcn/ui
2. 云函数需要配置环境变量（API密钥等）
3. 数据大盘需要配置RUM项目ID
