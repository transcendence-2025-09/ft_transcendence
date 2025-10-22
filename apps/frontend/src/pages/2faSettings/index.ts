import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";
import { pageFactory } from "../../factory/pageFactory";
import { actionsRowEl, loadUserInfo } from "./actionsRow";
import { modalOverlayEl } from "./modal";
import { successBannerEl } from "./successBanner";

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

wrapperEl.append(modalOverlayEl);

loadUserInfo();

export const Set2FA = pageFactory([SetPage]);
