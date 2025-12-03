import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { getRouter } from "../routing/instance";

const HeaderEl = eh<"header">(
  "header",
  {
    className:
      // レイアウト
      "sticky top-0 z-40 w-full " +
      "border-b border-slate-200/70 " +
      "bg-white/80 backdrop-blur-sm " +
      "px-4 sm:px-6 py-3 " +
      "flex items-center justify-between",
  },
  // 左側：タイトル
  eh(
    "h1",
    {
      className:
        "text-lg sm:text-xl font-semibold tracking-tight text-slate-900",
    },
    "ft_transcendence",
  ),
  // 右側：ナビゲーション
  eh(
    "nav",
    { className: "flex items-center gap-2" },
    // Homeボタン
    eh(
      "button",
      {
        className:
          "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium " +
          "text-sky-700 bg-sky-50 hover:bg-sky-100 " +
          "border border-sky-100 " +
          "transition-colors",
        "data-page": "home",
        type: "button",
      },
      "Home",
    ),
    // Aboutボタン
    eh(
      "button",
      {
        className:
          "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium " +
          "text-slate-700 bg-slate-50 hover:bg-slate-100 " +
          "border border-slate-200/70 " +
          "transition-colors",
        "data-page": "about",
        type: "button",
      },
      "About",
    ),
  ),
);

// ボタン要素を取得してイベントを紐付け
const homeBtn = HeaderEl.querySelector(
  '[data-page="home"]',
) as HTMLButtonElement | null;
const aboutBtn = HeaderEl.querySelector(
  '[data-page="about"]',
) as HTMLButtonElement | null;

if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const router = getRouter();
    router.navigate("/dashboard");
  });
}

// About モーダルの実装
function openAboutModal() {
  const overlay = document.createElement("div");
  overlay.setAttribute(
    "class",
    "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
  );

  const modal = document.createElement("div");
  modal.setAttribute(
    "class",
    "bg-white/95 rounded-2xl shadow-xl border border-slate-200 " +
      "max-w-md w-full mx-4 p-6 space-y-4 relative",
  );

  modal.innerHTML = `
    <h2 class="text-xl font-semibold text-slate-900">About ft_transcendence</h2>
    <p class="text-sm text-slate-600">
      この課題は、 ft_transcendence v18.0 に準拠して作成されています。
    </p>
    <div class="flex justify-end gap-2 pt-2">
      <button
        id="about-close"
        class="px-4 py-2 rounded-lg text-sm font-medium
               bg-slate-900 text-white hover:bg-slate-800
               transition-colors"
      >
        Close
      </button>
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

  const closeBtn = modal.querySelector(
    "#about-close",
  ) as HTMLButtonElement | null;
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
