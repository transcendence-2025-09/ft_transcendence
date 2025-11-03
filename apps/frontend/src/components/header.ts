import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";

const HeaderEl = eh<"header">(
  "header",
  { className: "p-3 border-b flex items-center justify-between" },
  eh("h1", { className: "text-xl font-bold" }, "ft_transcendence"),
  eh(
    "nav",
    { className: "flex gap-2 items-center" },
    // Homeボタン: ダッシュボードへ移動
    eh(
      "button",
      {
        className:
          "px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors",
        "data-page": "home",
        type: "button",
      },
      "Home",
    ),
    // Aboutボタン: モーダルを表示
    eh(
      "button",
      {
        className:
          "px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors",
        "data-page": "about",
        type: "button",
      },
      "About",
    ),
  ),
);

// ボタン要素を取得してイベントを紐付け
const homeBtn = HeaderEl.querySelector('[data-page="home"]') as HTMLButtonElement | null;
const aboutBtn = HeaderEl.querySelector('[data-page="about"]') as HTMLButtonElement | null;

if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // SPA的に遷移する場合はルーターを使うのが望ましいが、既存のコードベースでは
    // 単純に location.href で移動している箇所があるため同様に扱う
    window.location.href = "/dashboard";
  });
}

// About モーダルの実装
function openAboutModal() {
  const overlay = document.createElement("div");
  overlay.setAttribute("class", "fixed inset-0 flex items-center justify-center");
  overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
  overlay.style.setProperty("backdrop-filter", "blur(4px)");
  overlay.style.zIndex = "9999";

  // モーダル本体
  const modal = document.createElement("div");
  modal.setAttribute(
    "class",
    "bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6 relative",
  );

  modal.innerHTML = `
    <h2 class="text-2xl font-semibold mb-2">About ft_transcendence</h2>
    <p class="text-gray-600 mb-4">この課題は、 ft_transcendence v18.0に準拠して作成されています。</p>
    <div class="flex justify-end gap-2">
      <button id="about-close" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
  document.removeEventListener("keydown", onKeyDown);
  document.body.style.overflow = "";
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") close();
  };

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });

  const closeBtn = modal.querySelector("#about-close") as HTMLButtonElement | null;
  if (closeBtn) closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", onKeyDown);
}

if (aboutBtn) {
  aboutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openAboutModal();
  });
}

export const Header: ElComponent = componentFactory(HeaderEl);
