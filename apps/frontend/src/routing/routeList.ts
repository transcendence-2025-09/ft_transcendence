import type { ElComponent } from "../factory/componentFactory";
import { handleAuthCallback } from "../features";
import { Set2FA } from "../pages/2faSettings";
import { Validate2FA } from "../pages/2faValidate";
import { NotFound } from "../pages/404";
import { About } from "../pages/about";
import { Dashboard } from "../pages/dashboard";
import { Home } from "../pages/main";
import { pongPage } from "../pages/pong";
import { Tournaments } from "../pages/tournaments";
import { TournamentDetail } from "../pages/tournaments/detail";
import { TournamentMatches } from "../pages/tournaments/matches";
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
    meta: { title: "testpong" },
    path: "/pong",
    viewFactory: () => pongPage(),
  },
  {
    meta: { title: "pong" },
    path: "/pong/:tournamentId/:matchId",
    viewFactory: (ctx: RouteCtx) => pongPage(ctx),
  },
  {
    meta: { title: "tournament" },
    path: "/tournaments",
    viewFactory: () => Tournaments(),
  },
  {
    meta: { title: "tournamentDetail" },
    path: "/tournaments/:id",
    viewFactory: (ctx: RouteCtx) => TournamentDetail(ctx),
  },
  {
    meta: { title: "tournamentMatches" },
    path: "/tournaments/:id/matches",
    viewFactory: (ctx: RouteCtx) => TournamentMatches(ctx),
  },
  {
    meta: { title: "user" },
    path: "/user/:id",
    viewFactory: (ctx: RouteCtx) => User(ctx),
  },
  {
    meta: { title: "dashboard", protected: true, layout: "app" },
    path: "/dashboard",
    viewFactory: Dashboard,
  },
  {
    meta: { title: "Authenticating...", layout: "none" },
    path: "/auth/callback",
    action: handleAuthCallback,
  },
  {
    meta: { title: "2FA setting", protected: true },
    path: "/settings/2fa",
    viewFactory: () => Set2FA,
  },
  {
    meta: { title: "validate2FA", layout: "none" },
    path: "/auth/2fa/validate",
    viewFactory: () => Validate2FA,
  },
  {
    meta: { title: "not found" },
    path: "*",
    viewFactory: () => NotFound,
  },
];
