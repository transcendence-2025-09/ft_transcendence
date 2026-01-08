import "../style.css";
import { Header } from "@/components";
import { type ElComponent, layoutFactory, mainSlotFactory } from "@/factory";
import { initializeRouter, routeList } from "@/routing";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app not found");

// headerは外部で定義してimportする
const header: ElComponent = Header;
// mainはここでファクトリーを呼び出して生成
const main = mainSlotFactory();

//layoutも作ってそこにheader, mainを突っ込む
const layout = layoutFactory({ header, main });

initializeRouter({
  routes: routeList,
  layout,
  rootEl: root,
  onNavigateError: () => {
    console.error("navigation error");
  },
});
