import { eh } from "../../factory/elementFactory";
import { get2faQrCode } from "./api";
import { openModal } from "./modal";

const qrImageEl = eh<"img">("img", {
  className: "h-36 w-36 rounded-lg bg-white shadow-inner",
  alt: "2FA QR code",
  src: "",
});

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
      {
        className: "text-sm font-medium text-gray-700",
        htmlFor: "enableTwoFactorCode",
      },
      "認証コード",
    ),
    enableCodeInputEl,
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

const enableModalBodyEl = eh(
  "div",
  { className: "space-y-6" },
  eh(
    "div",
    {
      className:
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500",
    },
    qrImageEl,
    eh(
      "p",
      { className: "text-xs text-gray-500" },
      "スマートフォンの認証アプリでQRコードを読み取ってください。",
    ),
  ),
  eh(
    "div",
    { className: "rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700" },
    "QRコードを登録したら、アプリに表示されるワンタイムコードを以下に入力してください。コードは30秒ごとに更新されます。",
  ),
  enableCodeFormEl,
);

export const openEnableModal = async () => {
  enableCodeInputEl.value = "";
  const { qrCode } = await get2faQrCode();
  qrImageEl.src = qrCode;
  enableCodeInputEl.focus();

  openModal("二要素認証の有効化", enableModalBodyEl);
};
