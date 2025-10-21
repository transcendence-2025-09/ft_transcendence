import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";
import { pageFactory } from "../../factory/pageFactory";

const headingEl = eh<"h1">(
  "h1",
  { className: "text-3xl font-semibold text-gray-900" },
  "二要素認証",
);

const descriptionEl = eh<"p">(
  "p",
  {
    className: "mt-2 text-sm text-gray-600 leading-relaxed",
  },
  "認証アプリに表示されている6桁のコードを入力し、アカウントへのログインを完了してください。",
);

const codeLabelEl = eh<"label">(
  "label",
  {
    className: "text-sm font-medium text-gray-700",
    htmlFor: "twoFactorCode",
  },
  "認証コード",
);

const codeInputEl = eh<"input">("input", {
  id: "twoFactorCode",
  name: "twoFactorCode",
  type: "text",
  inputMode: "numeric",
  autoComplete: "one-time-code",
  maxLength: 6,
  className:
    "mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
  placeholder: "000000",
});

const helpTextEl = eh<"p">(
  "p",
  {
    className: "mt-2 text-xs text-gray-500",
  },
  "コードの有効期限は30秒です。失効した場合はアプリで最新のコードを確認してください。",
);

const submitButtonEl = eh<"button">(
  "button",
  {
    type: "submit",
    className:
      "mt-6 w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  },
  "この端末でログイン",
);

const formEl = eh<"form">(
  "form",
  {
    className: "mt-6",
  },
  eh("div", {}, codeLabelEl, codeInputEl, helpTextEl),
  submitButtonEl,
);

const cardEl = eh<"section">(
  "section",
  {
    className:
      "max-w-md w-full rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100",
  },
  headingEl,
  descriptionEl,
  formEl,
);

const wrapperEl = eh<"div">(
  "div",
  {
    className:
      "min-h-screen bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center",
  },
  cardEl,
);

const VerifyPage: ElComponent = componentFactory(wrapperEl);

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
});

export const Verify = pageFactory([VerifyPage]);
