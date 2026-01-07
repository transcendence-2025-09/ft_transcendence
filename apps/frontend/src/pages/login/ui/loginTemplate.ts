import { SignInButtonStyles } from "../constants";
import { loginBannerTemplate } from "./loginBannerTemplate";

export const loginTemplate = (nextUrl: string | null): string => {
  return `
    <div class="min-h-screen bg-white flex flex-col justify-center items-center">
        ${nextUrl ? loginBannerTemplate() : ""}
        <h1 class="text-6xl font-bold text-black mb-8">ft_transcendence</h1>
      <button id="signInBtn" class="${SignInButtonStyles.initial}">
        Sign in with 42
      </button>
    </div>
  `;
};
