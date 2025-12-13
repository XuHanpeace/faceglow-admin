import cloudbase from '@cloudbase/js-sdk'
import { CLOUDBASE_CONFIG } from '../config/cloudbase'

// 初始化云开发
const app = cloudbase.init({
  env: CLOUDBASE_CONFIG.ENV_ID,
})

// 获取数据库引用
export const db = app.database()

export default app

