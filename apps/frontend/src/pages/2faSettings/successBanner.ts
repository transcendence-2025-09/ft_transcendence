import { eh } from "../../factory/elementFactory";

export const successBannerEl = eh(
  "div",
  {
    className:
      "hidden mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700",
  },
  "二要素認証の設定が更新されました。",
);

export const showSuccessBanner = () => {
  successBannerEl.classList.remove("hidden");
};
