// ルーターのシングルトンインスタンスを管理
import type { RouteProps } from "./router";
import { createRouter } from "./router";

let routerInstance: ReturnType<typeof createRouter> | null = null;

export function initializeRouter(props: RouteProps) {
  if (!routerInstance) {
    routerInstance = createRouter(props);
    routerInstance.init();
  }
  return routerInstance;
}

export function getRouter() {
  if (!routerInstance) {
    throw new Error("Router has not been initialized");
  }
  return routerInstance;
}
