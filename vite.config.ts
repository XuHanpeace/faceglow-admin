import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// 在线编辑器插件，本地开发时可删除
import cloudStudio from './vite-plugin-cloudstudio'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), cloudStudio()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env.isApp": false,
      // 支持 REACT_APP_ 前缀的环境变量（兼容 Create React App 的约定）
      "process.env.REACT_APP_DASHSCOPE_API_KEY": JSON.stringify(env.REACT_APP_DASHSCOPE_API_KEY || ''),
      "process.env.REACT_APP_DOUBAO_API_KEY": JSON.stringify(env.REACT_APP_DOUBAO_API_KEY || ''),
      "process.env.REACT_APP_ARK_API_KEY": JSON.stringify(env.REACT_APP_ARK_API_KEY || ''),
    },
  }
});
