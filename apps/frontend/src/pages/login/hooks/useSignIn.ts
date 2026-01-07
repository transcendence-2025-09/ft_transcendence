import {
  AuthCancelledError,
  AuthFailedError,
  AuthTimeoutError,
  OAuthConfigError,
  PopupBlockedError,
  TwoFactorRequiredError,
} from "@/utils/errors";
import {
  ErrorMessages,
  ProgressSignInText,
  SignInButtonStyles,
} from "../constants";
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
      signInBtn.textContent = ProgressSignInText;
      signInBtn.className = SignInButtonStyles.loading;

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
      } else if (error instanceof OAuthConfigError) {
        alert(ErrorMessages.systemError);
      } else if (error instanceof PopupBlockedError) {
        alert(ErrorMessages.popupBlocked);
      } else if (error instanceof AuthCancelledError) {
        alert(ErrorMessages.authCancelled);
      } else if (error instanceof AuthTimeoutError) {
        alert(ErrorMessages.authTimeout);
      } else if (error instanceof AuthFailedError) {
        alert(ErrorMessages.authFailed);
      } else {
        alert(ErrorMessages.unknownError);
      }

      signInBtn.disabled = false;
      signInBtn.textContent = originalText;
      signInBtn.className = originalClassName;
    }
  });
};
