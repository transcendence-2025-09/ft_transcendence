import { fetchHealth } from "./example";
import { redirectTo42Auth, handleAuthCallback } from "./features";
import { componentFactory } from "./factory/componentFactory";
import { eh } from "./factory/elementFactory";
import "../style.css";

const status = await fetchHealth();
console.log("Health status:", status);

const root = document.querySelector<HTMLElement>("#app");
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

// --- 簡易的なルーター ---
const path = window.location.pathname;
if (path === "/auth/callback") {
  root.innerHTML = "<p>Authenticating, please wait...</p>";
  handleAuthCallback();
} else if (path === "/dashboard") {
  const token = localStorage.getItem("auth_token")
  root.innerHTML = `<h1>Your token is: ${token}</h1>`;
} else {
  const signInButton = eh(
    "button",
    { className: "px-4 py-2 bg-blue-600 text-white rounded" },
    "Sign in with 42",
  );
  signInButton.addEventListener("click", redirectTo42Auth);
  
  root.appendChild(signInButton);
}

