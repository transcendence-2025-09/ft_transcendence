import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";
import { pageFactory } from "../../factory/pageFactory";
import { openDisableModal } from "./disableModal";
import { openEnableModal } from "./enableModal";
import { modalOverlayEl } from "./modal";

const headingEl = eh<"h1">(
  "h1",
  { className: "text-3xl font-semibold text-gray-900" },
  "二要素認証の設定",
);

const descriptionEl = eh<"p">(
  "p",
  {
    className: "mt-3 text-sm text-gray-600 leading-relaxed",
  },
  "ログインの安全性を高めるため、認証アプリ（Google Authenticator など）を使った二要素認証を有効化できます。",
);

const successBannerEl = eh(
  "div",
  {
    className:
      "hidden mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700",
  },
  "二要素認証の設定が更新されました。",
);

const statusBadgeEl = eh(
  "span",
  {
    className:
      "inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700",
  },
  eh("span", { className: "h-2 w-2 rounded-full bg-gray-400" }),
  "現在: 未設定",
);

const generateButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  },
  "2FAを設定する",
);

const disableButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2",
  },
  "2FAを無効化",
);

const actionsRowEl = eh(
  "div",
  { className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" },
  statusBadgeEl,
  generateButtonEl,
  disableButtonEl,
);

const stepsListEl = eh(
  "ol",
  { className: "mt-8 space-y-4 text-sm text-gray-700" },
  eh(
    "li",
    { className: "flex items-start gap-3" },
    eh(
      "span",
      {
        className:
          "mt-0.5 h-6 w-6 rounded-full bg-blue-50 text-center text-sm font-semibold text-blue-600",
      },
      "1",
    ),
    eh(
      "div",
      {},
      eh("p", { className: "font-medium" }, "QRコードを取得"),
      eh(
        "p",
        { className: "mt-1 text-xs text-gray-500" },
        "「2FAを設定する」をクリックすると、QRコードが表示されます。認証アプリでQRコードをスキャンしてください。",
      ),
    ),
  ),
  eh(
    "li",
    { className: "flex items-start gap-3" },
    eh(
      "span",
      {
        className:
          "mt-0.5 h-6 w-6 rounded-full bg-blue-50 text-center text-sm font-semibold text-blue-600",
      },
      "2",
    ),
    eh(
      "div",
      {},
      eh("p", { className: "font-medium" }, "コードを入力して有効化"),
      eh(
        "p",
        { className: "mt-1 text-xs text-gray-500" },
        "アプリに表示されたワンタイムコードを入力し、「有効化」を押してください。",
      ),
    ),
  ),
);

const cardEl = eh<"section">(
  "section",
  {
    className:
      "max-w-3xl w-full rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100",
  },
  headingEl,
  descriptionEl,
  successBannerEl,
  actionsRowEl,
  stepsListEl,
);

const wrapperEl = eh<"div">(
  "div",
  {
    className:
      "min-h-screen bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center",
  },
  cardEl,
);

const SetPage: ElComponent = componentFactory(wrapperEl);

generateButtonEl.addEventListener("click", openEnableModal);
disableButtonEl.addEventListener("click", openDisableModal);

wrapperEl.append(modalOverlayEl);

export const Set2FA = pageFactory([SetPage]);
