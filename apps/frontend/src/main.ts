import { handleAuthCallback } from "./features";
import "../style.css";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import type { ElComponent } from "./factory/componentFactory";
import { layoutFactory } from "./factory/layoutFactory";
import { mainSlotFactory } from "./factory/mainSlotFactory";
import { routeList } from "./routing/routeList";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app not found");

// header,footerは外部で定義してimportする
const header: ElComponent = Header;
const footer: ElComponent = Footer;
// mainはここでファクトリーを呼び出して生成
const main = mainSlotFactory();

//layoutも作ってそこにheader, main, footerを突っ込む
const layout = layoutFactory({ header, main, footer });

// ルーティング設定（カスタムナビゲーション用）

// グローバルなページ管理システム
let currentPageType: "root" | "layout" = "root";
let currentRootPage: ElComponent | null = null;

// カスタムナビゲーション処理
const handleNavigation = async (pathname: string, pushState = true) => {
  if (pathname === "/") {
    // ルートページへの遷移
    if (currentPageType === "layout") {
      layout.unmount();
    }

    root.innerHTML = "";
    const { Home } = await import("./pages/main");
    if (currentRootPage) {
      currentRootPage.unmount();
    }
    currentRootPage = Home;
    Home.mount(root);
    currentPageType = "root";

    if (pushState) {
      history.pushState(null, "", pathname);
    }
  } else {
    // レイアウト付きページへの遷移
    if (currentPageType === "root") {
      root.innerHTML = "";
      if (currentRootPage) {
        currentRootPage.unmount();
        currentRootPage = null;
      }
      layout.mount(root);
    }
    currentPageType = "layout";

    // 通常のルーティング処理を手動実行
    const u = new URL(pathname, location.origin);
    const normPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const query = u.searchParams;

    // ルートを見つけてページを設定
    const route =
      routeList.find((r) => r.path === normPath) ||
      routeList[routeList.length - 1];
    const ctx = { params: {}, query };
    const page = route.viewFactory(ctx);
    layout.setPage(page);

    if (pushState) {
      history.pushState(null, "", pathname);
    }
  }
};

// グローバルクリックハンドラー
document.addEventListener("click", async (ev) => {
  const a = (ev.target as HTMLElement)?.closest(
    "a",
  ) as HTMLAnchorElement | null;
  if (!a) return;
  if (a.target && a.target !== "_self") return;
  if (a.hasAttribute("download")) return;
  if (ev.metaKey || ev.altKey || ev.shiftKey || ev.ctrlKey) return;

  const href = a.getAttribute("href");
  if (!href || href.startsWith("http")) return;

  ev.preventDefault();
  await handleNavigation(href);
});

// ブラウザバック/フォワード処理
window.addEventListener("popstate", async () => {
  await handleNavigation(window.location.pathname, false);
});

// 初期化処理
const path = window.location.pathname;

if (path === "/auth/callback") {
  root.innerHTML = "<p>Authenticating, please wait...</p>";
  handleAuthCallback();
} else if (path === "/dashboard") {
  const res = await fetch("/api/user/me", {
    method: "GET",
    credentials: "include", // cookie内のJWTを送信するために必要
  });
  if (res.status === 200) {
    const data = await res.json();
    root.innerHTML = `<h1>dashboard</h1><p>Welcome, ${data.name}!</p>`;
  }
} else {
  // 通常のページルーティング（ルートページ含む）
  await handleNavigation(path, false);
}
