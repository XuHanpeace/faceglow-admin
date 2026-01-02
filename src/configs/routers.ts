import DASHBOARD from '../pages/dashboard.jsx';
import PRODUCTS from '../pages/products.jsx';
import ORDERS from '../pages/orders.jsx';
import USERS from '../pages/users.jsx';
import ANALYTICS from '../pages/analytics.jsx';
import SETTINGS from '../pages/settings.jsx';
import LOGIN from '../pages/login.jsx';
import PRODUCT_ADD from '../pages/product-add.jsx';
import PRODUCT_EDIT from '../pages/product-edit.jsx';
import PRODUCT_DETAIL from '../pages/product-detail.jsx';
import ORDER_DETAIL from '../pages/order-detail.jsx';

// FaceGlow 管理后台页面
import DashboardPage from '../pages/DashboardPage';
import AlbumListPage from '../pages/AlbumListPage';
import BatchGeneratePage from '../pages/BatchGeneratePage';
import CategoryManagePage from '../pages/CategoryManagePage';
import WorkflowPage from '../pages/WorkflowPage';

export const routers = [
  {
    id: "dashboard",
    component: DashboardPage, // 使用新的数据大盘页面
    isHome: true
  },
  {
    id: "albums",
    component: AlbumListPage
  },
  {
    id: "batch-generate",
    component: BatchGeneratePage
  },
  {
    id: "categories",
    component: CategoryManagePage
  },
  {
    id: "workflow",
    component: WorkflowPage
  },
  {
    id: "products",
    component: PRODUCTS
  },
  {
    id: "orders",
    component: ORDERS
  },
  {
    id: "users",
    component: USERS
  },
  {
    id: "analytics",
    component: ANALYTICS
  },
  {
    id: "settings",
    component: SETTINGS
  },
  {
    id: "login",
    component: LOGIN
  },
  {
    id: "product-add",
    component: PRODUCT_ADD
  },
  {
    id: "product-edit",
    component: PRODUCT_EDIT
  },
  {
    id: "product-detail",
    component: PRODUCT_DETAIL
  },
  {
    id: "order-detail",
    component: ORDER_DETAIL
  }
]
