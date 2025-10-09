import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { handleAuthCallback } from "../features";
import { NotFound } from "../pages/404";
import { About } from "../pages/about";
import { Home } from "../pages/main";
import { pongPage } from "../pages/pong";
import { TournamentDetail } from "../pages/tournamentDetail";
import { Tournaments } from "../pages/tournaments";
import { User } from "../pages/user/user";

// { id: 15 } みたいなデータ。ユーザーidとかを扱うとき
export type Params = Record<string, string>;

//params, queryを持つオブジェクト
export type RouteCtx = {
  params: Params;
  query: URLSearchParams;
};

// ctxはこの後個人ページなど人によって違うデータをdatabaseから引っ張ってきて表示する場合などにctxを使ってcomponentを作る
export type ViewFactory = (ctx: RouteCtx) => ElComponent | Promise<ElComponent>;

//Redirect用のオブジェクト。これを見てリダイレクト先を決定する
export type RedirectResult = { redirect: string; replace?: boolean };

//routeに入れるメタ情報
export type RouteMeta = {
  title?: string;
  layout?: "none" | "app";
  protected?: boolean;
  loading?: ElComponent;
};

//pathとそれに対応するpage factoryを持つオブジェクトのtype
//navigateしてviewFactoryを呼ぶ間にonEnterが発火
export type Route = {
  meta: RouteMeta;
  path: string;
  viewFactory?: ViewFactory;
  action?: (
    ctx: RouteCtx,
  ) => undefined | Promise<undefined | RedirectResult> | RedirectResult;
};

//これはテストようなので実際はpageコンポーネントで別ファイルとして定義した方がいい
const Dashboard = (name: string): ElComponent => {
  const el = document.createElement("div");
  el.innerHTML = `
    <h1>dashboard</h1>
    <p>Welcome, ${name}!</p>
    <a href="/tournaments" class="inline-block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      トーナメント一覧
    </a>
  `;
  return componentFactory(el);
};

//pageを追加するときはここにどんどん追加していく。not foundは必ず1番下に記述すること
export const routeList: Route[] = [
  {
    meta: { title: "Home", layout: "none", protected: false },
    path: "/",
    viewFactory: () => Home,
  },
  {
    meta: { title: "about" },
    path: "/about",
    viewFactory: () => About,
  },
  {
    meta: { title: "pong" },
    path: "/pong",
    viewFactory: () => pongPage,
  },
  {
    meta: { title: "tournament" },
    path: "/tournaments",
    viewFactory: () => Tournaments,
  },
  {
    meta: { title: "tournamentDetail" },
    path: "/tournaments/:id",
    viewFactory: (ctx: RouteCtx) => TournamentDetail(ctx),
  },
  {
    meta: { title: "user" },
    path: "/user/:id",
    viewFactory: (ctx: RouteCtx) => User(ctx),
  },
  {
    meta: { title: "dashboard", protected: true, layout: "app" },
    path: "/dashboard",
    viewFactory: async () => {
      const res = await fetch("/api/user/me", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Unorthorized");
      const data = await res.json();
      return Dashboard(data.name ?? "User");
    },
  },
  {
    meta: { title: "Authenticating...", layout: "none" },
    path: "/auth/callback",
    action: async (_ctx) => {
      try {
        await handleAuthCallback();
        if (window.opener) {
          window.opener.postMessage(
            { type: "AUTH_SUCCESS" },
            window.location.origin,
          );
          window.close();
          return;
        } else {
          return { redirect: "/dashboard", replace: true };
        }
      } catch (err: unknown) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "AUTH_ERROR",
              error:
                err instanceof Error ? err.message : "Authentication Failed",
            },
            window.location.origin,
          );
          window.close();
          return;
        } else {
          return { redirect: "/dashboard", replace: true };
        }
      }
    },
  },
  {
    meta: { title: "not found" },
    path: "*",
    viewFactory: () => NotFound,
  },
];
