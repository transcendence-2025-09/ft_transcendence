import { handleAuthCallback } from "./features";
import "../style.css";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import type { ElComponent } from "./factory/componentFactory";
import { layoutFactory } from "./factory/layoutFactory";
import { mainSlotFactory } from "./factory/mainSlotFactory";
import type { Params, Route } from "./routing/routeList";
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

// 動的ルーティング
function matchRoute(
  pathname: string,
  routes: Route[],
): { route: Route; params: Params } {
  // 静的パスマッチング
  const staticMatch = routes.find((r) => r.path === pathname);
  if (staticMatch) return { route: staticMatch, params: {} };

  // 動的パスマッチング
  for (const route of routes) {
    if (!route.path.includes(":")) continue;

    const routeParts = route.path.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    if (routeParts.length !== pathParts.length) continue;

    const params: Params = {};
    let isMatch = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) return { route, params };
  }

  return { route: routes[routes.length - 1], params: {} };
}

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
    const { route, params } = matchRoute(normPath, routeList);
    const ctx = { params, query };
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

  // ポップアップから開かれた場合の処理
  if (window.opener) {
    try {
      await handleAuthCallback();
      // 親ウィンドウに成功を通知
      window.opener.postMessage(
        { type: "AUTH_SUCCESS" },
        window.location.origin,
      );
      window.close();
    } catch (error) {
      // 親ウィンドウにエラーを通知
      window.opener.postMessage(
        {
          type: "AUTH_ERROR",
          error: error instanceof Error ? error.message : "認証に失敗しました",
        },
        window.location.origin,
      );
      window.close();
    }
  } else {
    // 通常のタブで開かれた場合の従来の処理
    handleAuthCallback();
  }
} else if (path === "/dashboard") {
  const res = await fetch("/api/user/me", {
    method: "GET",
    credentials: "include", // cookie内のJWTを送信するために必要
  });
  if (res.status === 200) {
    const data = await res.json();
    root.innerHTML = `
      <h1>dashboard</h1>
      <p>Welcome, ${data.name}!</p>
      <a href="/tournaments" class="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        トーナメント一覧
      </a>
    `;
  }
} else {
  // 通常のページルーティング（ルートページ含む）
  await handleNavigation(path, false);
}
