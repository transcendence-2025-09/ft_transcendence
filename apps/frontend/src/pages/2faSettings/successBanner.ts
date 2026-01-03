import { eh } from "@/factory";

export const successBannerEl = eh(
  "div",
  {
    className:
      "hidden mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700",
  },
  "二要素認証の設定が更新されました。",
);

let hideTimer: number | undefined;

export const showSuccessBanner = () => {
  successBannerEl.classList.remove("hidden");
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer);
  }
  hideTimer = window.setTimeout(() => {
    successBannerEl.classList.add("hidden");
    hideTimer = undefined;
  }, 3000);
};
