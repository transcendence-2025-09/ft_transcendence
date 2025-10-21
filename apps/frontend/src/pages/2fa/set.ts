import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";
import { pageFactory } from "../../factory/pageFactory";

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
    eh("span", { className: "mt-0.5 h-6 w-6 rounded-full bg-blue-50 text-center text-sm font-semibold text-blue-600" }, "1"),
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
    eh("span", { className: "mt-0.5 h-6 w-6 rounded-full bg-blue-50 text-center text-sm font-semibold text-blue-600" }, "3"),
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
  "コードは30秒ごとに更新されます。最新のコードを入力してください。",
);

const submitButtonEl = eh<"button">(
  "button",
  {
    type: "submit",
    className:
      "mt-6 w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  },
  "2FAを有効化",
);

const formEl = eh<"form">(
  "form",
  {
    className: "mt-8",
  },
  eh("div", {}, codeLabelEl, codeInputEl, helpTextEl),
  submitButtonEl,
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

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
});

const overlayEl = eh(
  "div",
  {
    className:
      "fixed inset-0 z-50 hidden flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm",
  },
);

const modalContainerEl = eh(
  "div",
  {
    className: "relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl",
  },
);

const modalCloseButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    ariaLabel: "閉じる",
  },
  "×",
);

const modalTitleEl = eh(
  "h2",
  { className: "text-lg font-semibold text-gray-900" },
  "",
);

const modalBodyEl = eh("div", { className: "mt-4" });

modalContainerEl.append(modalCloseButtonEl, modalTitleEl, modalBodyEl);
overlayEl.append(modalContainerEl);

const closeModal = () => {
  overlayEl.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
};

modalCloseButtonEl.addEventListener("click", closeModal);

overlayEl.addEventListener("click", (event) => {
  if (event.target === overlayEl) {
    closeModal();
  }
});

const openModal = (title: string, content: HTMLElement) => {
  modalTitleEl.textContent = title;
  modalBodyEl.replaceChildren(content);
  overlayEl.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
};

const manualCodeValueEl = eh(
  "code",
  { className: "select-all font-mono text-xs text-gray-800" },
  "------",
);

const enableQrStageNextButtonEl = eh(
  "button",
  {
    type: "button",
    className:
      "mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  },
  "コード入力へ",
);

const enableQrStageEl = eh(
  "div",
  { className: "space-y-6" },
  eh(
    "div",
    {
      className:
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500",
    },
    eh(
      "div",
      {
        className:
          "flex h-40 w-40 items-center justify-center rounded-lg bg-white shadow-inner",
      },
      eh("span", { className: "text-xs text-gray-400" }, "QRコードがここに表示されます"),
    ),
    eh(
      "p",
      { className: "text-xs text-gray-500" },
      "手動入力用コード: ",
      manualCodeValueEl,
    ),
  ),
  enableQrStageNextButtonEl,
);

const enableCodeInputEl = eh<"input">("input", {
  id: "enableTwoFactorCode",
  name: "twoFactorCode",
  type: "text",
  inputMode: "numeric",
  autoComplete: "one-time-code",
  maxLength: 6,
  className:
    "mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
  placeholder: "000000",
});

const enableCodeFormEl = eh(
  "form",
  { className: "space-y-4" },
  eh(
    "div",
    {},
    eh(
      "label",
      { className: "text-sm font-medium text-gray-700", htmlFor: "enableTwoFactorCode" },
      "認証コード",
    ),
    enableCodeInputEl,
    eh(
      "p",
      { className: "mt-2 text-xs text-gray-500" },
      "認証アプリに表示された最新のコードを入力してください。",
    ),
  ),
  eh(
    "button",
    {
      type: "submit",
      className:
        "w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    },
    "2FAを有効化",
  ),
);

enableCodeFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
});

const enableCodeStageEl = eh(
  "div",
  { className: "space-y-4 hidden" },
  eh(
    "p",
    { className: "text-sm text-gray-600" },
    "アプリに表示された6桁のコードを入力し、有効化を完了させます。",
  ),
  enableCodeFormEl,
);

const enableModalBodyEl = eh(
  "div",
  { className: "space-y-6" },
  enableQrStageEl,
  enableCodeStageEl,
);

const setEnableStage = (stage: "qr" | "code") => {
  if (stage === "qr") {
    enableQrStageEl.classList.remove("hidden");
    enableCodeStageEl.classList.add("hidden");
  } else {
    enableQrStageEl.classList.add("hidden");
    enableCodeStageEl.classList.remove("hidden");
    enableCodeInputEl.focus();
  }
};

enableQrStageNextButtonEl.addEventListener("click", () => {
  setEnableStage("code");
});

const disableCodeInputEl = eh<"input">("input", {
  id: "disableTwoFactorCode",
  name: "twoFactorCode",
  type: "text",
  inputMode: "numeric",
  autoComplete: "one-time-code",
  maxLength: 6,
  className:
    "mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg tracking-widest text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
  placeholder: "000000",
});

const disableFormEl = eh(
  "form",
  { className: "space-y-4" },
  eh(
    "div",
    {},
    eh(
      "label",
      { className: "text-sm font-medium text-gray-700", htmlFor: "disableTwoFactorCode" },
      "認証コード",
    ),
    disableCodeInputEl,
    eh(
      "p",
      { className: "mt-2 text-xs text-gray-500" },
      "現在設定されている二要素認証のコードを入力してください。",
    ),
  ),
  eh(
    "button",
    {
      type: "submit",
      className:
        "w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2",
    },
    "2FAを無効化",
  ),
);

disableFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
});

const disableModalBodyEl = eh(
  "div",
  { className: "space-y-4" },
  eh(
    "p",
    { className: "text-sm text-gray-600" },
    "二要素認証を無効化するには、現在の認証コードで本人確認を行います。",
  ),
  disableFormEl,
);

const openEnableModal = () => {
  manualCodeValueEl.textContent = "------";
  enableCodeInputEl.value = "";
  setEnableStage("qr");
  openModal("二要素認証の有効化", enableModalBodyEl);
};

const openDisableModal = () => {
  disableCodeInputEl.value = "";
  openModal("二要素認証の無効化", disableModalBodyEl);
};

generateButtonEl.addEventListener("click", openEnableModal);
disableButtonEl.addEventListener("click", openDisableModal);

wrapperEl.append(overlayEl);

export const Set2FA = pageFactory([SetPage]);
