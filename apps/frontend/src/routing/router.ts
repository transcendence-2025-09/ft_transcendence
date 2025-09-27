import type { ElComponent } from "../factory/componentFactory";
import type { RouteCtx } from "./routeList";
import type { Params } from "./routeList";
import type { Layout } from "../factory/layoutFactory";
import type { Route } from "./routeList";

export type RouteProps = {
  routes: Route[];
  layout: Layout;
  basePath?: string;
  onNavigateError: () => void;
};

//createRouterでやっている処理
//init -> aタグのクリック時の処理を奪ってnavigateを呼び出す処理に上書き. browser back処理を加える。初回描画の実行
//navigate -> この先login formなどを作って、ユーザーを作った後に画面遷移をするときはnavigateを呼び出す
//引数には移送したい先のURLを入れておく。ex) navigate(/login/success);
//navigateの第二引数にはオブジェクトを入れてあるので、拡張可能。replaceはブラウザバックを可能にするかどうかによって変える
//ユーザー登録完了画面に遷移させる時とかはブラウザバックさせないようにnavigate("/register/success", { replace: true})
//と呼び出せばOK
export const createRouter = (props: RouteProps) => {
  let isInit: boolean = false;

  const init = () => {
    if (isInit) return;
    isInit = true;

    document.addEventListener("click", (ev) => {
      const a = (ev.target as HTMLElement)?.closest(
        "a",
      ) as HTMLAnchorElement | null;

      // aタグがない場合
      if (!a) return;
      //targetが_selfじゃない場合、外部リンクなど？
      if (a.target && a.target !== "_self") return;
      //downloadの時
      if (a.hasAttribute("download")) return;
      //通常のクリックじゃない時
      if (ev.metaKey || ev.altKey || ev.shiftKey || ev.ctrlKey) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      ev.preventDefault();
      navigate(href);
    });

    //browser backの処理
    //browser backの処理では履歴の更新をしない（pushStateを実行しない)
    window.addEventListener("popstate", () => {
      const u = new URL(location.href);
      const path = normalizePath(stripBase(u.pathname, props.basePath));
      const query = u.searchParams;
      const match = matchRoute(path, props.routes);
      const ctx: RouteCtx = { params: match.params, query: query };
      const page = match.route.viewFactory(ctx);
      props.layout.setPage(page);
    });

    //初回描画
    //こっちも同じでnavigateを呼ぶと履歴の更新が行われるのでただの描画処理のみ行う
    const u = new URL(location.href);
    const path = normalizePath(stripBase(u.pathname, props.basePath));
    const query = u.searchParams;
    const match = matchRoute(path, props.routes);
    const ctx: RouteCtx = { params: match.params, query: query };
    const page = match.route.viewFactory(ctx);
    props.layout.setPage(page);
  };

  const navigate = async (url: string, { replace = false } = {}) => {
    const u = new URL(url, location.origin);
    //basePath外のroutingに関してはnavigateしない
    if (props.basePath && !u.pathname.startsWith(props.basePath)) return;

    //URLのnormalizeを行う。基本的には全部normalizeしたものを使ってrouting処理。
    //この先/user/:idみたいなユーザーによって表示するページを変える場合には、
    //normalizeしたものを使ったほうが楽
    const normPath = normalizePath(stripBase(u.pathname, props.basePath));
    const query = u.searchParams;

    // 生成したurlにマッチするpageを探す。見つからない場合は404 not foundのページを返す
    const match: { route: Route; params: Params } = matchRoute(
      normPath,
      props.routes,
    );

    //urlの履歴の追加
    const href =
      (props.basePath !== "/" ? props.basePath : "") +
      normPath +
      (u.search || "");
    if (replace) history.replaceState(null, "", href);
    else history.pushState(null, "", href);

    //実際にviewFactoryを呼び出してpageを作ったら、setPageに渡してmountする
    try {
      const ctx: RouteCtx = { params: match.params, query: query };
      const page: ElComponent = match.route?.viewFactory(ctx);
      props.layout.setPage(page);
    } catch (_e) {
      props.onNavigateError();
    }
  };

  //baseがある場合はそれを消す。baseはサービスのデプロイ先がサブディレクトリの場合に設定する(基本必要なさそうだけど一応実装)
  const stripBase = (pathname: string, base?: string) => {
    if (!base || base === "/") return pathname;
    if (pathname.startsWith(base)) return pathname.slice(base.length) || "/";
    else return pathname;
  };

  //末尾が/で終わっている場合それを取り除く。ただしただの/だけの場合は例外で/だけを返す
  //この先/user/:idみたいなrouting処理を加える場合はここで正規化処理をする
  const normalizePath = (pathname: string) => {
    if (pathname !== "/" && pathname.endsWith("/"))
      return pathname.slice(0, -1);
    return pathname;
  };

  //propsのroutes配列からpathnameに一致するものを探してRouteオブジェクトを返す。
  //あとparamsに関してはURLオブジェクトから取って来れないからこの返り値に入れておく
  const matchRoute = (
    pathname: string,
    routes: Route[],
  ): { route: Route; params: Params } => {
    const params: Params = {};
    const found: Route = routes.find((r) => r.path === pathname) as Route;
    if (found) return { route: found, params: params };
    //routesの最後は必ずnot foundにしておく
    else {
      const notFound: Route = routes.at(-1) as Route;
      return { route: notFound, params: params };
    }
  };

  return { init, navigate };
};
