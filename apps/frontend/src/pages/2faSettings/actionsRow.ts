import { MeResponseSchema } from "@transcendence/shared";
import { eh } from "../../factory/elementFactory";
import { fetchAndParse } from "../../utils/fetchAndParse";
import { openDisableModal } from "./disableModal";
import { openEnableModal } from "./enableModal";

const statusBadgeEl = eh(
  "span",
  {
    className:
      "inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700",
  },
  "現在: 取得中…",
);

const generateButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "hidden items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  },
  "2FAを設定する",
);

const disableButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "hidden items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2",
  },
  "2FAを無効化",
);

generateButtonEl.addEventListener("click", openEnableModal);
disableButtonEl.addEventListener("click", openDisableModal);

export const actionsRowEl = eh(
  "div",
  { className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" },
  statusBadgeEl,
  generateButtonEl,
  disableButtonEl,
);

const updateStatusUI = (enabled: boolean) => {
  statusBadgeEl.innerHTML = "";
  const indicatorEl = eh("span", {
    className: enabled
      ? "h-2 w-2 rounded-full bg-green-500"
      : "h-2 w-2 rounded-full bg-gray-400",
  });

  statusBadgeEl.className = enabled
    ? "inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
    : "inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700";

  statusBadgeEl.append(
    indicatorEl,
    document.createTextNode(enabled ? "現在: 有効" : "現在: 未設定"),
  );

  if (enabled) {
    generateButtonEl.classList.add("hidden");
    disableButtonEl.classList.remove("hidden");
  } else {
    generateButtonEl.classList.remove("hidden");
    disableButtonEl.classList.add("hidden");
  }
};

export const loadUserInfo = async () => {
  try {
    const me = await fetchAndParse("/api/user/me", MeResponseSchema, {
      method: "GET",
      credentials: "include",
    });
    updateStatusUI(me.two_factor_enabled);
  } catch (_error) {
    statusBadgeEl.textContent = "現在: 状態取得に失敗しました";
  }
};
