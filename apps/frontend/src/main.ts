import { eh } from "./factory/elementFactory";
import { handleAuthCallback, redirectTo42Auth } from "./features";
import "../style.css";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import type { ElComponent } from "./factory/componentFactory";
import { layoutFactory } from "./factory/layoutFactory";
import { mainSlotFactory } from "./factory/mainSlotFactory";
import { routeList } from "./routing/routeList";
import type { RouteProps } from "./routing/router";
import { createRouter } from "./routing/router";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app not found");

//  header,footerは外部で定義してimportする
const header: ElComponent = Header;
const footer: ElComponent = Footer;
//mainはここでファクトリーを呼び出して生成
const main = mainSlotFactory();

//layoutも作ってそこにheader, main, footerを突っ込む
const layout = layoutFactory({ header, main, footer });
layout.mount(root);

//navigate errorのための関数。この先詳しい実装を加える
const navigateError = () => alert("navigate Error");

//create routerに渡すオブジェクトの作成
const routerProps: RouteProps = {
  routes: routeList,
  layout: layout,
  basePath: "/",
  onNavigateError: navigateError,
};

//routerの作成
const router = createRouter(routerProps);
router.init();

// ヘッダー内ボタンにページ切替ハンドラを付与
// const nav = header.el.querySelector("nav");
// nav?.addEventListener("click", (e) => {
//   const btn = (e.target as HTMLElement)?.closest(
//     "button[data-page]",
//   ) as HTMLButtonElement | null;
//   if (!btn) return;
//   const p = btn.dataset.page;
//   if (p === "home") layout.setPage(Home);
//   else if (p === "about") layout.setPage(About);
// });

const path = window.location.pathname;
if (path === "/auth/callback") {
  root.innerHTML = "<p>Authenticating, please wait...</p>";
  handleAuthCallback();
} else if (path === "/dashboard") {
  root.innerHTML = `<h1>dashboard</h1>`;
} else {
  const signInButton = eh(
    "button",
    { className: "px-4 py-2 bg-blue-600 text-white rounded" },
    "Sign in with 42",
  );
  signInButton.addEventListener("click", redirectTo42Auth);

  root.appendChild(signInButton);
}
