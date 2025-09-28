# Vanilla DOM UI Mini-Framework — README

このドキュメントは、提供された **コンポーネント基盤（ElComponent）**、**要素ヘルパー（eh）**、**レイアウト（layoutFactory / mainSlotFactory）**、**ページ合成（pageFactory）** を、**このコードを書いていない人**でも運用できるように、責務、内部挙動、公開 API、使用例、注意点まで体系化したものです。
対象は TypeScript/DOM を素手で扱う上級者（状態管理やイベントは別途実装）。

---

## 1. コア概念と型

### 1.1 ElComponent（抽象コンポーネント）

```ts
export type ElComponent<T extends HTMLElement = HTMLElement> = {
  el: T;
  mount: (target: Element, anchor?: Node | null) => void;
  unmount: () => void;
};
```

**責務**

- `el`: そのコンポーネントの**ルート HTMLElement**。
- `mount(target, anchor?)`: `target.insertBefore(el, anchor)` で**1回だけ**マウントする。
- `unmount()`: `el.remove()` と**子の unmount 呼び出し**（合成系で）を担う。

**不変条件 / 取り決め**

- 同一インスタンスは**二重 mount しない**（内部フラグで防止）。
- mount/unmount は**対**。複数回 mount したい場合は**新しいインスタンス**を生成する。
- 外部から `el` を直接 DOM に挿入/削除しない（ライフサイクル破壊防止）。

---

## 2. コンポーネント生成

### 2.1 `componentFactory(el)`

```ts
export const componentFactory = <T extends HTMLElement = HTMLElement>(el: T): ElComponent<T> => { ... };
```

**責務**

- 既存の `el` を包み、ElComponent の**最小実装**を提供。
- `mount(target, anchor?)` は `insertBefore` により**指定位置**へ挿入。
- `unmount()` は `el.remove()` のみ（**子の管理は呼び出し側の責務**）。

**内部**

- `mounted` フラグで二重 mount 防止。
- 最初に渡された `anchor` を `savedAnchor` に保持（以後も同位置方針）。

**想定用途**

- 単一要素の軽量なコンポーネント（ロゴ、ボタン、単純な領域など）の雛形。

---

## 3. 要素ヘルパー

### 3.1 `eh(type, props?, ...children)`

```ts
export type TagName = keyof HTMLElementTagNameMap;
export type Attr = string | number | boolean | undefined | null;
export type PropsType = Readonly<Record<string, Attr>>;
export type ChildType = string | number | Node;

export const eh = <K extends TagName>(
  type: K,
  props?: PropsType,
  ...children: ChildType[]
): HTMLElementTagNameMap[K] => { ... };
```

**責務**

- `document.createElement(type)` を型安全に行い、**属性設定と子追加**まで一括で行う。

**属性処理ルール**

- `null | undefined | false` は**無視**（属性を付与しない）。
- `true` は**空属性**として付与（例: `disabled=""`）。
- `className` キーは `class` にマップ。
- それ以外のキーは `setAttribute(key, String(value))`。

**子ノード処理**

- `string | number` → `TextNode` にして append。
- `Node` → そのまま append（再帰的に `eh` 結果も可）。

**注意**

- **イベントは張らない**（`onclick` などは props で受けず、呼び出し側で `addEventListener` を使う）。
- プロパティ直設定（`value` など）は行わない設計。必要なら**生成後に明示的代入**。

---

## 4. レイアウト・ページ挿入

### 4.1 `mainSlotFactory()`

```ts
export type MainSlot = ElComponent & { slotAnchor: Comment };

export const mainSlotFactory = (): MainSlot => {
  // <main tabindex="-1"><!-- page-slot --></main>
};
```

**責務**

- ページが差し替わる**スロット領域**（`<main>`）を提供。
- `slotAnchor: Comment` を挿入し、**ページ挿入位置のアンカー**にする。

**内部**

- `componentFactory` を使って `<main>` を ElComponent 化。
- `tabindex=-1`: フォーカス制御・アクセシビリティ配慮の前準備。

**使い方**

- `layoutFactory` から `setPage(next)` 時に `next.mount(main.el, main.slotAnchor)` で**固定位置に差し込む**。

---

### 4.2 `layoutFactory({ header, main, footer })`

```ts
export type LayoutProps = {
  header: ElComponent;
  main: MainSlot;
  footer: ElComponent;
};
export type Layout = ElComponent & { setPage: (page: ElComponent) => void };

export const layoutFactory = (props: LayoutProps): Layout => { ... };
```

**責務**

- アプリ全体の**外枠（レイアウト）**を構築し、**ページ差し替え**を司る。
- `mount(target, anchor?)` 時に `header/main/footer` を **container** 内へ追加 → container をターゲットへ挿入 → 各部位を **順に mount**。
- `unmount()` は **逆順**に安全に unmount（現在ページ → footer → main → header → container）。
- `setPage(next)` は**現在ページの unmount → 新ページを main の slotAnchor に mount → currentPage 差し替え**。

**内部**

- `container`（`<div id="layout">`）がレイアウトのルート。
- 二重 mount 防止。`currentPage` を保持し、差し替えの整合性を保証。

**制約**

- `header/main/footer` は **ElComponent として管理**（直接 DOM 操作しない）。
- `setPage` で渡す `next` は **新インスタンス推奨**（再利用での二重 mount を避ける）。

---

## 5. 複合ページ

### 5.1 `pageFactory(children: ElComponent[])`

```ts
export const pageFactory = (children: ElComponent[]): ElComponent => { ... };
```

**責務**

- 子コンポーネント配列から**ページ（1コンポーネント）を合成**。
- `mount` は container を挿入後、**全子の mount を順に呼ぶ**。
- `unmount` は**全子の unmount → container.remove()**。

**使いどころ**

- 1 ページ = 複数セクションの集合、という構造を**安全なライフサイクル**で実現。

---

## 6. ライフサイクルと責務境界（要点）

- **作る:** `eh` で要素を作る → `componentFactory` 等で ElComponent 化する。
- **合成:** `pageFactory` で複数子をまとめて 1 ページにする。
- **レイアウト:** `layoutFactory` が `header/main/footer` を設置し、`setPage` でページ差し替え。
- **ルータ等の外部:** 画面遷移やエラー処理は**外部（ルータ）**から `setPage` を呼ぶだけで良い。

> **DOM の挿入/削除は必ず mount/unmount 経由**で行う（強い規律）。
> 直接 `appendChild/remove` はしない。ライフサイクル破壊の原因になる。

---

## 7. サンプルコード

### 7.1 Header / Footer / Main Slot の定義

```ts
// header.ts
import { componentFactory } from "./componentFactory";
import { eh } from "./elementFactory";

export const createHeader = () => {
  const el = eh(
    "header",
    { className: "p-4 border-b" },
    eh("h1", { className: "text-xl font-bold" }, "My App"),
  );
  const c = componentFactory(el);
  // 例: イベントを張るなら mount 時に
  const origMount = c.mount;
  c.mount = (target, anchor) => {
    origMount(target, anchor);
    // el.addEventListener("click", ...);
  };
  c.unmount = () => {
    // el.removeEventListener("click", ...);
    // cleanup...
    el.remove();
  };
  return c;
};

// footer.ts
import { componentFactory } from "./componentFactory";
import { eh } from "./elementFactory";

export const createFooter = () =>
  componentFactory(
    eh("footer", { className: "p-4 border-t text-sm" }, "© 2025"),
  );
```

```ts
// mainSlot.ts
import { mainSlotFactory } from "./mainSlotFactory";
export const createMain = () => mainSlotFactory();
```

### 7.2 ページの定義（合成）

```ts
// pages/home.ts
import { eh } from "../elementFactory";
import { componentFactory } from "../componentFactory";
import { pageFactory } from "../pageFactory";

const hero = () =>
  componentFactory(eh("section", { className: "p-6" }, eh("h2", {}, "Home")));

const content = () =>
  componentFactory(eh("section", { className: "p-6" }, "Welcome."));

export const createHomePage = () => pageFactory([hero(), content()]);

// pages/about.ts
export const createAboutPage = () =>
  pageFactory([componentFactory(eh("section", {}, "About"))]);
```

### 7.3 レイアウトに載せる & ページ切り替え

```ts
// app.ts
import { layoutFactory } from "./layoutFactory";
import { createHeader } from "./header";
import { createFooter } from "./footer";
import { createMain } from "./mainSlot";
import { createHomePage } from "./pages/home";
import { createAboutPage } from "./pages/about";

const outlet = document.getElementById("app")!;
const layout = layoutFactory({
  header: createHeader(),
  main: createMain(),
  footer: createFooter(),
});

layout.mount(outlet); // レイアウト設置
layout.setPage(createHomePage()); // 初期ページ

// 遷移例（ルータやボタンから呼ぶ）
document.getElementById("go-about")?.addEventListener("click", () => {
  layout.setPage(createAboutPage());
});
```

---

## 8. 外部 API として使うときの約束

- **生成系**:

  - `componentFactory(el)` / `pageFactory(children)` / `mainSlotFactory()` / `layoutFactory(props)`

- **ライフサイクル**:

  - `mount(target, anchor?)` は**1回**、`unmount()` は**対**。
  - **イベントやリソースのクリーンアップ**は `unmount` で必ず行う。

- **レイアウト制御**:

  - `Layout#setPage(next)` により**現在ページを安全に差し替え**可能。
  - `next` は**新規インスタンス**が基本（再利用すると二重 mount の危険）。

- **拡張（将来）**:

  - `componentFactory` に「ctx を受け取る」拡張余地あり（TODO コメント参照）。
  - 状態や DI を扱う場合は、**外部から factory の引数に渡す**のが簡潔。

---

## 9. よくある設計・実装の落とし穴

1. **直接 DOM 操作**

   - コンポーネント外で `el` を直接 append/remove しない。必ず `mount/unmount`。

2. **イベントの付けっぱなし**

   - `mount` で add、`unmount` で remove を徹底（メモリリーク防止）。

3. **コンポーネント再利用の二重 mount**

   - 同インスタンスを複数ページで使い回さない。**factory で毎回作る**。

4. **属性 vs プロパティ**

   - `eh` は **属性のみ**設定。`value/checked` などは**別途プロパティ代入**が必要。

5. **アンカー位置の乱れ**

   - `mainSlot.slotAnchor` を**常に差し込み位置**として使う。`setPage` 内では既に配慮済み。

---

## 10. テスト観点（チェックリスト）

- レイアウト: `mount → setPage(A) → setPage(B) → unmount` の順で DOM が期待通り。
- 子ページ: `pageFactory` が子の mount/unmount を**順序と対称性**を持って呼ぶ。
- イベント: `mount/unmount` 間でハンドラやタイマーが**きちんと解放**される。
- `eh`:

  - boolean 属性の扱い（`true`→空属性、`false`→無視）
  - `className` → `class` 変換
  - 子の `string/number/Node` の混在

- mainSlot: `slotAnchor` に差し込み、**前後の DOM を壊さない**。

---

## 11. 拡張ガイド（簡易）

- **状態注入**:
  `const createCounterPage = (store: Store) => pageFactory([...])` のように DI する。
- **非同期/データ取得**:
  ページ factory 内で `mount` 時に fetch → DOM 更新。`unmount` で中断/cleanup。
- **アクセシビリティ**:
  ページ切替で `main.el.focus()`、ライブリージョン活用などを `setPage` 直後に。

---

### 付録：最小ユーティリティ（型と責務の一覧）

- `ElComponent<T>`: ルート要素 + mount/unmount（**インスタンスのライフサイクル**）
- `componentFactory(el)`: 既存要素を ElComponent 化（**最小骨格**）
- `eh(type, props?, ...children)`: createElement + setAttribute + 子追加（**構文糖**）
- `mainSlotFactory()`: `<main><!-- page-slot --></main>` を ElComponent 化（**差し込み点**）
- `layoutFactory({ header, main, footer })`: レイアウト＋`setPage`（**差し替え管理**）
- `pageFactory(children)`: 子コンポーネント群からページを構築（**合成**）

---

**まとめ**
この設計は「**DOM を安全に差し替える最小限の規律**」に集中しています。

- DOM への入出は **mount/unmount** 経由のみ
- ページ差し替えは **Layout#setPage**
- 要素生成は **eh**、合成は **pageFactory**

これらを守るだけで、**リークのない堅実な SPA ランタイム**を素手の TypeScript/DOM で実現できます。
