import { loginBannerTemplate } from "./loginBannerTemplate";

export const loginTemplate = (nextUrl: string | null): string => {
  return `
    <div class="min-h-screen bg-white flex flex-col justify-center items-center">
        ${nextUrl ? loginBannerTemplate() : ""}
        <h1 class="text-6xl font-bold text-black mb-8">ft_transcendence</h1>
      <button id="signInBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
        Sign in with 42
      </button>
    </div>
  `;
};
