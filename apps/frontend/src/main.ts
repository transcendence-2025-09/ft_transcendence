import { fetchHealth } from "./example";
import { componentFactory } from "./factory/componentFactory";
import { eh } from "./factory/elementFactory";
import "../style.css";

const status = await fetchHealth();
console.log("Health status:", status);

const root = document.querySelector<HTMLElement>("#app")!;
if (!root) throw new Error("#app not found");

// 1) 表示/非表示を切り替える対象のコンポーネント
const divEl = eh<"div">(
  "div",
  { className: "text-gray-100 bg-blue-600 p-4 rounded" },
  "Hello World",
  eh<"p">("p", {}, "This p tag"),
);
const divComp = componentFactory(divEl);

// 2) トグル用ボタン（factoryで作成）
const toggleBtn = eh<"button">(
  "button",
  { className: "mt-4 px-3 py-1 bg-gray-800 text-white rounded" },
  "Hide",
);

// 3) 初期マウント：コンポーネントを表示、ボタンも設置
root.appendChild(toggleBtn);
divComp.mount(root, toggleBtn);

// 4) ボタン押下で mount/unmount を切り替え
toggleBtn.addEventListener("click", () => {
  if (root.contains(divComp.el)) {
    divComp.unmount();
    toggleBtn.textContent = "Show";
  } else {
    divComp.mount(root);
    toggleBtn.textContent = "Hide";
  }
});
