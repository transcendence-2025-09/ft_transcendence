import type { ElComponent } from "@/factory";
import {
  About,
  Dashboard,
  Home,
  NotFound,
  pongPage,
  Set2FA,
  TournamentDetail,
  TournamentMatches,
  Tournaments,
  Validate2FA,
} from "@/pages";
import { handleAuthCallback } from "@/utils";

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
  protected: boolean;
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

//pageを追加するときはここにどんどん追加していく。not foundは必ず1番下に記述すること
export const routeList: Route[] = [
  {
    meta: { title: "Home", layout: "none", protected: false },
    path: "/",
    viewFactory: (ctx: RouteCtx) => Home(ctx),
  },
  {
    meta: { title: "about", protected: false },
    path: "/about",
    viewFactory: () => About,
  },
  {
    meta: { title: "testpong", protected: false },
    path: "/pong",
    viewFactory: () => pongPage(),
  },
  {
    meta: { title: "pong", protected: true },
    path: "/pong/:tournamentId/:matchId",
    viewFactory: (ctx: RouteCtx) => pongPage(ctx),
  },
  {
    meta: { title: "tournament", protected: true },
    path: "/tournaments",
    viewFactory: () => Tournaments(),
  },
  {
    meta: { title: "tournamentDetail", protected: true },
    path: "/tournaments/:id",
    viewFactory: (ctx: RouteCtx) => TournamentDetail(ctx),
  },
  {
    meta: { title: "tournamentMatches", protected: true },
    path: "/tournaments/:id/matches",
    viewFactory: (ctx: RouteCtx) => TournamentMatches(ctx),
  },
  {
    meta: { title: "dashboard", protected: true, layout: "app" },
    path: "/dashboard",
    viewFactory: Dashboard,
  },
  {
    meta: { title: "Authenticating...", layout: "none", protected: false },
    path: "/auth/callback",
    action: handleAuthCallback,
  },
  {
    meta: { title: "2FA setting", protected: true },
    path: "/settings/2fa",
    viewFactory: () => Set2FA,
  },
  {
    meta: { title: "validate2FA", layout: "none", protected: false },
    path: "/auth/2fa/validate",
    viewFactory: () => Validate2FA(),
  },
  {
    meta: { title: "not found", protected: false },
    path: "*",
    viewFactory: () => NotFound,
  },
];
