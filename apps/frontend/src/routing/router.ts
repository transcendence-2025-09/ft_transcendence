import type { ElComponent } from "../factory/componentFactory";
import type { Layout } from "../factory/layoutFactory";
import type { Params, Route, RouteCtx } from "./routeList";

export type RouteProps = {
  routes: Route[];
  layout: Layout;
  basePath?: string;
  onNavigateError: () => void;
  rootEl: HTMLElement;
};

const ensureAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/user/me", {
      method: "GET",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
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
  let mountedLayout = false;
  let currentRootPage: ElComponent | null = null;
  //layoutの有無によってlayout.setPageかrootに直接マウントかを制御する
  const renderForRoot = async (url: URL, { replace = false } = {}) => {
    //basepathのそとはエラー
    if (props.basePath && !url.pathname.startsWith(props.basePath)) return;

    const path = normalizePath(stripBase(url.pathname, props.basePath));
    const query = url.searchParams;
    const { route, params } = matchRoute(path, props.routes);
    const ctx: RouteCtx = { params, query };

    //routeにactionを定義している場合はそれを最優先
    if (route.action) {
      const res = await route.action(ctx);
      if (res && typeof res === "object" && "redirect" in res) {
        return navigate(res.redirect, { replace: !!res.replace });
      }
      return;
    }

    //未ログインの場合はloginにリダイレクト
    if (route.meta.protected) {
      const ok = await ensureAuth();
      if (!ok) {
        const next = url.pathname + (url.search || "");
        //login後に前の画面に戻ってくるための処理をしておくが、あとで調整してもいい
        return navigate(`/?next=${encodeURIComponent(next)}`, {
          replace: true,
        });
      }
    }

    //既定はapp（レイアウトがある状態？）ここは検討の余地あり
    const layoutMode = route.meta.layout ?? "app";

    //urlの組み立て
    const basePrefix =
      props.basePath && props.basePath !== "/" ? props.basePath : "";
    const qs = url.searchParams.toString(); // ← 生のクエリ文字列
    const searchStr = qs ? `?${qs}` : ""; // ← ? を付けるかどうか決定
    const href = basePrefix + path + searchStr; // ← これを push/replace に使う

    if (replace) history.replaceState(null, "", href);
    else history.pushState(null, "", href);

    if (route.viewFactory) {
      try {
        const pageOrPromise = route.viewFactory(ctx);
        if (layoutMode === "none") {
          //layoutのマウント状況を監視
          if (mountedLayout) {
            props.layout.unmount();
            mountedLayout = false;
          }
          //現在のpageをunmountっ
          if (currentRootPage) {
            currentRootPage.unmount();
            currentRootPage = null;
          }
          const page = await pageOrPromise;
          //root要素に直接マウント
          page.mount(props.rootEl);
          //currentRootPageをセットしておく
          currentRootPage = page;
        } else {
          //rootElをlayoutにマウント
          if (!mountedLayout) {
            props.layout.mount(props.rootEl);
            mountedLayout = true;
          }
          if (currentRootPage) {
            currentRootPage.unmount();
            currentRootPage = null;
          }
          props.layout.setPage(pageOrPromise);
        }
      } catch (_e) {
        props.onNavigateError();
      }
    }
  };

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
      const url: URL = new URL(href, location.origin);
      renderForRoot(url, { replace: false });
    });

    //browser backの処理
    //browser backの処理では履歴の更新をしない（pushStateを実行しない)
    window.addEventListener("popstate", () => {
      const url: URL = new URL(location.href);
      renderForRoot(url, { replace: true });
    });

    //初回描画
    //こっちも同じでnavigateを呼ぶと履歴の更新が行われるのでただの描画処理のみ行う
    const url: URL = new URL(location.href);
    renderForRoot(url, { replace: true });
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
    const basePrefix =
      props.basePath && props.basePath !== "/" ? props.basePath : "";
    const qs = u.searchParams.toString();
    const searchStr = qs ? `?${qs}` : "";
    const href = basePrefix + normPath + searchStr;

    if (replace) history.replaceState(null, "", href);
    else history.pushState(null, "", href);

    //実際にviewFactoryを呼び出してpageを作ったら、setPageに渡してmountする
    if (match.route.viewFactory) {
      try {
        const ctx: RouteCtx = { params: match.params, query: query };
        const page: ElComponent | Promise<ElComponent> =
          match.route?.viewFactory(ctx);
        props.layout.setPage(page);
      } catch (_e) {
        props.onNavigateError();
      }
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

  //URLが動的パターンの場合はregexpに変換しておく
  //ここではroutingに登録してある"/user/:id"みたいな文字列を登録しておくことで、
  //実際に"/user/124"みたいなURLがきたらそれに対応できるようにする。
  const compilePattern = (
    path: string,
  ): { regex: RegExp; keys: string[] } | null => {
    if (path === "*" || path === "/*") return null;

    // "/user/:id -> ["user", ":id"]"みたいな感じに分割する
    const segments = path.split("/").filter(Boolean);
    const keys: string[] = [];

    //各セグメントを正規化する
    const parts: string[] = segments.map((seg, i) => {
      if (seg === "*") {
        const isLast = i === segments.length - 1;
        return isLast ? "(?:/.*)?" : "/.*";
      }

      if (seg.startsWith(":")) {
        const optional = seg.endsWith("?");
        const name = seg.slice(1, optional ? -1 : undefined);
        if (!name) throw new Error(`Invalid param in "${path}"`);
        keys.push(name);

        const cap = "([^/]+)";
        return optional ? `(?:/${cap})?` : `/${cap}`;
      }

      return `/${seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
    });

    const pattern = `^${parts.join("") || "/"}$`;
    return { regex: new RegExp(pattern), keys };
  };

  //動的ルーティングの実装
  //実際のurlとroutesに登録してあるpathとの動的マッチングを行う。
  const dynamicMatch = (pathname: string, routePath: string): Params | null => {
    const compiled = compilePattern(routePath);
    if (!compiled) return null;
    const m = compiled.regex.exec(pathname);
    if (!m) return null;

    const params: Params = {};
    for (let i = 0; i < compiled.keys.length; ++i) {
      const raw = m[i + 1];
      if (raw !== undefined) params[compiled.keys[i]] = decodeURIComponent(raw);
    }
    return params;
  };

  //propsのroutes配列からpathnameに一致するものを探してRouteオブジェクトを返す。
  //あとparamsに関してはURLオブジェクトから取って来れないからこの返り値に入れておく
  const matchRoute = (
    pathname: string,
    routes: Route[],
  ): { route: Route; params: Params } => {
    console.log(pathname);
    const params: Params = {};
    const foundStatic: Route = routes.find((r) => r.path === pathname) as Route;
    if (foundStatic) return { route: foundStatic, params: params };

    for (let i = 0; i < routes.length - 1; ++i) {
      const r = routes[i];
      if (!/[:*]/.test(r.path)) continue;
      const p = dynamicMatch(pathname, r.path);
      if (p) return { route: r, params: p };
    }

    //routesの最後は必ずnot foundにしておく
    const notFound: Route = routes.at(-1) as Route;
    return { route: notFound, params: params };
  };

  return { init, navigate };
};
