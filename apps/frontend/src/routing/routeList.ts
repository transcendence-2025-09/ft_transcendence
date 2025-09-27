import type { ElComponent } from "../factory/componentFactory";
import { Home } from "../pages/main";
import { About } from "../pages/about";
import { NotFound } from "../pages/404";

// { id: 15 } みたいなデータ。ユーザーidとかを扱うとき
export type Params = Record<string, string>;

//params, queryを持つオブジェクト
export type RouteCtx = {
  params: Params;
  query: URLSearchParams;
};

// ctxはこの後個人ページなど人によって違うデータをdatabaseから引っ張ってきて表示する場合などにctxを使ってcomponentを作る
export type ViewFactory = (ctx: RouteCtx) => ElComponent;

//pathとそれに対応するpage factoryを持つオブジェクトのtype
export type Route = {
  name: string;
  path: string;
  viewFactory: ViewFactory;
};

//pageを追加するときはここにどんどん追加していく。not foundは必ず1番下に記述すること
export const routeList: Route[] = [
  {
    name: "Home",
    path: "/",
    viewFactory: () => Home,
  },
  {
    name: "About",
    path: "/about",
    viewFactory: () => About,
  },
  {
    name: "not found",
    path: "*",
    viewFactory: () => NotFound,
  },
];
