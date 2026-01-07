import { TwoFactorRequiredError } from "@/utils/errors";
import { handleOAuthWithPopup, mockLogin } from "../services";

export const useSignInHandler = (
  el: HTMLElement,
  nextUrl: string | null,
): void => {
  const signInBtn = el.querySelector("#signInBtn") as HTMLButtonElement | null;

  if (!signInBtn) return;

  signInBtn.addEventListener("click", async () => {
    if (signInBtn.disabled) return;

    const originalText = signInBtn.textContent;
    const originalClassName = signInBtn.className;

    try {
      signInBtn.disabled = true;
      signInBtn.textContent = "サインイン中...";
      signInBtn.className =
        "bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg cursor-not-allowed opacity-50";

      if (import.meta.env.DEV) {
        await mockLogin();
      } else {
        await handleOAuthWithPopup();
      }

      window.location.href = nextUrl
        ? decodeURIComponent(nextUrl)
        : "/dashboard";
    } catch (error) {
      if (error instanceof TwoFactorRequiredError) {
        window.location.href = "/auth/2fa/validate";
        return;
      }

      alert("認証に失敗しました。もう一度お試しください。");

      signInBtn.disabled = false;
      signInBtn.textContent = originalText;
      signInBtn.className = originalClassName;
    }
  });
};
