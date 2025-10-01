import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

// import type { RouteCtx } from "../routing/routeList";

const titleEl = eh<"div">("div", { className: "p-4" }, "This is HOME page.");
const textEl = eh<"div">(
  "div",
  { className: "p-4" },
  "Mount / Unmount test is working",
);

const linkEl = eh<"a">(
  "a",
  { href: "/about", className: "text-blue-500", target: "_self" },
  "About Page",
);

const buttonEl = eh<"button">(
  "button",
  { 
    className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-4"
  },
  "クリックしてね",
);

const Title: ElComponent = componentFactory(titleEl);
const Text: ElComponent = componentFactory(textEl);
const Link: ElComponent = componentFactory(linkEl);
const Button: ElComponent = componentFactory(buttonEl);

// ボタンにイベントリスナーを追加
Button.el.addEventListener('click', () => {
  alert("ボタンがクリックされました！");
});

export const Home = pageFactory([Title, Text, Link, Button]);

// export const HomeFactory = (ctx: RouteCtx) => {
//   return pageFactory([Title, Text, Link]);
// };
