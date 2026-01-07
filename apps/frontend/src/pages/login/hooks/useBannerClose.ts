export const useBannerCloseHandler = (el: HTMLElement): void => {
  const bannerCloseBtn = el.querySelector(
    "#bannerCloseBtn",
  ) as HTMLButtonElement | null;

  if (!bannerCloseBtn) return;

  bannerCloseBtn.addEventListener("click", () => {
    const banner = el.querySelector("#loginBanner");
    if (banner) {
      banner.classList.add("hidden");
    }
  });
};
