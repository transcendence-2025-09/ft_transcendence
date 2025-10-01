import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

// import type { RouteCtx } from "../routing/routeList";

// 大きなタイトル
const titleEl = eh<"h1">(
  "h1",
  { className: "text-6xl font-bold text-black mb-8" },
  "Title",
);

// Sign in with 42 ボタン
const signInButtonEl = eh<"button">(
  "button",
  {
    className:
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200",
  },
  "Sign in with 42",
);

// 中央配置のコンテナ
const containerEl = eh<"div">(
  "div",
  {
    className:
      "min-h-screen bg-white flex flex-col justify-center items-center",
  },
  titleEl,
  signInButtonEl,
);

const Container: ElComponent = componentFactory(containerEl);

// Sign in ボタンにイベントリスナーを追加
signInButtonEl.addEventListener("click", () => {
  // 42 OAuth認証へのリダイレクトなどを実装
  console.log("42でサインインします");
  alert("42でサインインします");
});

export const Home = pageFactory([Container]);

// export const HomeFactory = (ctx: RouteCtx) => {
//   return pageFactory([Title, Text, Link]);
// };
