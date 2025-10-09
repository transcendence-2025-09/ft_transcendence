// import { handleAuthCallback } from "./features";
import "../style.css";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import type { ElComponent } from "./factory/componentFactory";
import { layoutFactory } from "./factory/layoutFactory";
import { mainSlotFactory } from "./factory/mainSlotFactory";
import { routeList } from "./routing/routeList";
import { createRouter } from "./routing/router";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app not found");

// header,footerは外部で定義してimportする
const header: ElComponent = Header;
const footer: ElComponent = Footer;
// mainはここでファクトリーを呼び出して生成
const main = mainSlotFactory();

//layoutも作ってそこにheader, main, footerを突っ込む
const layout = layoutFactory({ header, main, footer });

const router = createRouter({
  routes: routeList,
  layout,
  rootEl: root,
  onNavigateError: () => {
    console.error("navigattion error");
  },
});

router.init();
