import { eh } from "@/factory";
import { loadUserInfo } from "./actionsRow";
import { disable2fa } from "./api";
import { closeModal, openModal } from "./modal";
import { showSuccessBanner } from "./successBanner";

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
      {
        className: "text-sm font-medium text-gray-700",
        htmlFor: "disableTwoFactorCode",
      },
      "認証コード",
    ),
    disableCodeInputEl,
    eh(
      "p",
      { className: "mt-2 text-xs text-gray-500" },
      "アプリに表示されているワンタイムコードを入力してください。",
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

disableFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = disableCodeInputEl.value;
  try {
    await disable2fa(code);
    closeModal();
    loadUserInfo();
    showSuccessBanner();
  } catch (error) {
    alert(error);
  }
});

export const openDisableModal = () => {
  disableCodeInputEl.value = "";
  openModal("二要素認証の無効化", disableModalBodyEl);
};
