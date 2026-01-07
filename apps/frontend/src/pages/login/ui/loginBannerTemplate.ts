export const loginBannerTemplate = (): string => {
  return `
        <div id="loginBanner" class="fixed top-0 left-0 right-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-center shadow-sm">
          <span>ログインしていないか、セッションが切れました。再度ログインしてください。</span>
          <button type="button" id="bannerCloseBtn" class="ml-4 text-amber-600 hover:text-amber-800 transition-colors" aria-label="閉じる">✕</button>
        </div>
      `;
};
