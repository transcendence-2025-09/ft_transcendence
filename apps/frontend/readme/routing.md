# Minimal SPA Router — README

このドキュメントは、提示されたコード一式（`routeList` と `createRouter`）の**処理プロセス**、**使い方**、**各関数の権限（責務）**、**外部から利用できるAPI**を、初見の人でも理解できるように整理したものです。
対象はバニラ DOM/TypeScript を前提とした、シンプルなクライアントサイド・ルーターです。

---

## 0. 何を解決するか

- `<a>` クリックを SPA ルーティングに切り替え、**ページ全体の再読込なし**で画面を切り替える
- `history.pushState/replaceState` による**履歴管理**
- `popstate`（ブラウザ戻る/進む）に対応
- 静的ルートに加え、`/user/:id` のような**動的パラメータ**と、`/docs/*` のような**末尾ワイルドカード**を扱う
- `ctx = { params, query }` を **viewFactory** に渡し、ページ実装側で動的データを使える

---

## 1. 用語・型の基本

```ts
export type Params = Record<string, string>; // :id 等の動的パラメータ
export type RouteCtx = { params: Params; query: URLSearchParams };

export type ViewFactory = (ctx: RouteCtx) => ElComponent;

export type Route = {
  name: string; // 表示名や識別に利用
  path: string; // "/", "/about", "/user/:id", "/docs/*", "*" (404)
  viewFactory: ViewFactory; // ページを生成
};
```

- **ElComponent**: `{ el: HTMLElement; mount(target, anchor?); unmount(); }` を想定したコンポーネント。
- **ctx**: `params` と `query` を束ねたルーティングコンテキスト。

---

## 2. 公開API（外部から使う入口）

`createRouter(props: RouteProps) => { init(): void; navigate(url: string, opts?: { replace?: boolean }): Promise<void> }`

```ts
export type RouteProps = {
  routes: Route[]; // ルート定義（末尾は必ず 404="*"）
  layout: Layout; // { setPage(page: ElComponent): void }
  basePath?: string; // サブディレクトリ配信時に使用 (例: "/app")
  onNavigateError: () => void; // ページ生成失敗時のフォールバック
};
```

- `init()`

  - 1回だけ初期化：

    - `<a>` クリック横取り → `navigate` に委譲（外部リンクや修飾キー付きは除外）
    - `popstate` 監視（戻る/進むで**描画のみ**更新）
    - **初回描画**（履歴は更新しない）

- `navigate(url, { replace })`

  - プログラム的遷移：

    - ルート解決 → ページ生成 → `layout.setPage`
    - `pushState` または `replaceState` で履歴更新
    - `basePath` 外は無視（遷移しない）

> **この2つ以外**は内部実装（private扱い）。外部から呼ぶのは `init` と `navigate` のみです。

---

## 3. 主要フロー（プロセス）

### 3.1 初回描画（`init()` 内）

1. `location.href` → `URL` を構築
2. `stripBase()` で `basePath` を除去、`normalizePath()` で末尾 `/` を正規化
3. `matchRoute(pathname, routes)` で `route` と `params` を確定
4. `ctx = { params, query: u.searchParams }`
5. `page = route.viewFactory(ctx)` → `layout.setPage(page)`

> 初回は**履歴を更新しない**（同じURLでのページ再生成に留める）

### 3.2 `<a>` クリック横取り

- 条件に該当する内部リンクのみ `preventDefault()` → `navigate(href)`

  - 除外条件（横取りしない）：`target != "_self"`, `download` 属性, 修飾キー付き, `http` 始まり（外部）

### 3.3 戻る/進む（`popstate`）

- 履歴は更新せず、**描画のみ**更新（`viewFactory(ctx)` → `layout.setPage(page)`）

### 3.4 `navigate(url, { replace })`

1. `new URL(url, location.origin)` で絶対化
2. `basePath` チェック（外れていれば無視）
3. `stripBase` → `normalizePath`
4. `matchRoute` で `route` と `params` を確定
5. `href = basePath + normPath + (search || "")`
6. `replace ? history.replaceState : history.pushState`
7. `viewFactory(ctx)` → `layout.setPage(page)`
   失敗時は `onNavigateError()` を呼ぶ

---

## 4. ルーティングアルゴリズム（`matchRoute`）

### 評価順

1. **静的完全一致**（`r.path === pathname`）
2. **動的一致**（`: や *` を含むルートのみ、定義順に `dynamicMatch`）
3. **404**（配列末尾の `"*"`、フォールバック）

> この順序により、`/about` と `/:page` が競合しても、**静的**が優先されます。

### 動的パターンの仕組み（`compilePattern` / `dynamicMatch`）

- 例：`/user/:id` → 正規表現 `^/user/([^/]+)$` と `keys=["id"]` にコンパイル
- 実URL `/user/123` に `exec()` → `["/user/123","123"]`
  → `params.id = "123"`
- 対応パターン

  - `:name` … 1セグメント（`/` を含まない）をキャプチャ
  - `:name?` … 末尾オプショナル（`/user` と `/user/42` を両方許可）
  - `*` … **末尾ワイルドカード**（`/docs` と `/docs/...`）

**注意**

- ワイルドカードは**末尾のみ**が安全（中間 `.*` は曖昧性が高い）
- 静的セグメントは**正規表現エスケープ**（`.` 等がメタとして解釈されないように）

---

## 5. 関数の権限（責務）一覧

| 関数 / 変数                         | 権限（責務）                                                      |
| ----------------------------------- | ----------------------------------------------------------------- |
| `createRouter(props)`               | ルーターの生成（外部 API を返す）                                 |
| `init()`                            | 初期化一回限り：クリック横取り / popstate 監視 / 初回描画         |
| `navigate(url, opts)`               | プログラム的遷移：履歴更新 + 画面更新（例外時 `onNavigateError`） |
| `stripBase(path, base)`             | `basePath` を取り除く                                             |
| `normalizePath(path)`               | 末尾 `/` の正規化（`/` 単体は除外）                               |
| `compilePattern(path)`              | ルート定義のパターンを `RegExp + keys` に変換                     |
| `dynamicMatch(pathname, routePath)` | 単一ルートでの動的一致判定 + `params` 復元                        |
| `matchRoute(pathname, routes)`      | **静的→動的→404** の順でルートを決定し `params` を返す            |

> **外部から呼ぶのは** `init` / `navigate` のみ。他は内部実装。

---

## 6. 使い方（セットアップ例）

### 6.1 ルート定義

```ts
import { Home } from "../pages/main";
import { About } from "../pages/about";
import { NotFound } from "../pages/404";
import { User } from "../pages/user"; // (ctx) => ElComponent

export const routeList: Route[] = [
  { name: "Home", path: "/", viewFactory: () => Home },
  { name: "About", path: "/about", viewFactory: () => About },
  { name: "user", path: "/user/:id", viewFactory: (ctx) => User(ctx) },
  { name: "not found", path: "*", viewFactory: () => NotFound }, // ★最後に置く
];
```

### 6.2 ルーター起動

```ts
import { createRouter } from "./routing/router";
import { routeList } from "./routing/routeList";
import { createLayout } from "../factory/layoutFactory";

const outlet = document.getElementById("app")!;
const layout = createLayout(outlet); // layout.setPage(page) を提供

const router = createRouter({
  routes: routeList,
  layout,
  basePath: "/", // 例: "/app"（サブディレクトリ配信時）
  onNavigateError: () => alert("Failed to render page"),
});

router.init();

// プログラム的遷移例
document.getElementById("toUser")?.addEventListener("click", () => {
  router.navigate("/user/123"); // pushState
});
document.getElementById("done")?.addEventListener("click", () => {
  router.navigate("/register/success", { replace: true }); // replaceState
});
```

### 6.3 ページ側（ctx の利用例）

```ts
// pages/user.ts
import { componentFactory } from "../factory/componentFactory";
import { pageFactory } from "../factory/pageFactory";
import { eh } from "../factory/elementFactory";
import type { RouteCtx } from "../routing/routeList";

const UserHeader = (ctx: RouteCtx) =>
  componentFactory(
    eh("h2", { className: "text-xl p-4" }, `User #${ctx.params.id}`),
  );

const TabInfo = (ctx: RouteCtx) =>
  componentFactory(
    eh(
      "div",
      { className: "p-2" },
      `tab=${ctx.query.get("tab") ?? "overview"}`,
    ),
  );

export const User = (ctx: RouteCtx) =>
  pageFactory([UserHeader(ctx), TabInfo(ctx)]);
```

---

## 7. 典型ケース（挙動例）

- `/about` → 静的一致 → `{ route: About, params: {} }`
- `/user/42` → 動的一致 → `{ route: user, params: { id: "42" } }`
- `/user/%E3%81%9F%E3%82%8D` → `{ id: "たろ" }`（URLデコード）
- `/docs` / `/docs/a/b`（定義があれば） → ワイルドカード一致
- `/nope` → 404（末尾ルート）にフォールバック

---

## 8. エラーハンドリング・制約

- `viewFactory` 実行で例外が出たら、描画は行わず `onNavigateError()` を呼ぶ
- **404 は必ず `routes` の最後**に置くこと（`"*"` が他を飲み込まないため）
- オプショナル `:name?` と `*` は**末尾セグメントのみ**を推奨（曖昧性回避）
- 静的セグメントは**正規表現エスケープ済み**なので安全
- `basePath` を設定する場合、`stripBase`/`href` 生成により**配下のみ**を遷移対象にする

---

## 9. テストのためのユーティリティ（任意）

```ts
function tryMatch(path: string, routes: Route[]) {
  const { route, params } = matchRoute(path, routes);
  console.log(`${path} → ${route.name}`, params);
}

tryMatch("/", routeList);
tryMatch("/about", routeList);
tryMatch("/user/123", routeList);
tryMatch("/user/%E3%81%82", routeList);
tryMatch("/docs/intro/getting-started", routeList);
tryMatch("/unknown", routeList);
```

---

## 10. 拡張の指針

- **事前コンパイル**: 起動時に `compilePattern` 結果をキャッシュして高速化
- **複数パラメータ**: `/blog/:year/:slug` も現設計で対応可
- **ガード**: `navigate` 前に認可チェック → 不許可なら `/login?next=...`
- **遅延ロード**: `viewFactory` 内で動的 import → ローディング表示と統合
- **ワイルドカードの値取得**: 必要なら `*` を `/(.*)` に変えて `params.rest` に格納する拡張も可能

---

## 11. まとめ（運用ルール）

1. **ルート定義**は静的→動的→**最後に404**の順で並べる
2. **ページ生成は `viewFactory(ctx)`** に集約（`ctx.params` / `ctx.query` を使用）
3. **DOM の差し替えは `layout.setPage(page)`** に一本化
4. クリック横取り・戻る/進むは**ルーターが面倒を見る**
5. `navigate(url, { replace })` を使えばプログラム的に遷移・履歴制御ができる

このガイドに沿えば、最小の責務で読みやすく・拡張しやすい SPA ルーティングが運用できます。
