// 云开发配置
export const CLOUDBASE_CONFIG = {
  // 环境ID
  ENV_ID: 'startup-2gn33jt0ca955730',
  
  // 数据库API配置
  DATABASE_API: {
    BASE_URL: 'https://startup-2gn33jt0ca955730.api.tcloudbasegateway.com',
    VERSION: 'v1',
  },
  
  // 云函数API配置
  FUNCTION_API: {
    BASE_URL: 'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com',
  },
  
  // COS配置
  COS: {
    BUCKET: 'myhh2',
    REGION: 'ap-nanjing',
    APP_ID: '1257391807',
  },
} as const

