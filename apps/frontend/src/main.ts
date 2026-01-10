import "../style.css";
import { Footer, Header } from "@/components";
import { type ElComponent, layoutFactory, mainSlotFactory } from "@/factory";
import { initializeRouter, routeList } from "@/routing";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app not found");

// header,footerは外部で定義してimportする
const header: ElComponent = Header;
const footer: ElComponent = Footer;
// mainはここでファクトリーを呼び出して生成
const main = mainSlotFactory();

//layoutも作ってそこにheader, main, footerを突っ込む
const layout = layoutFactory({ header, main, footer });

initializeRouter({
  routes: routeList,
  layout,
  rootEl: root,
  onNavigateError: () => {
    console.error("navigation error");
  },
});
