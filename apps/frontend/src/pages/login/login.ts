import { componentFactory, type ElComponent, pageFactory } from "@/factory";
import { ensureAuth, type RouteCtx } from "@/routing";
import { useBannerCloseHandler, useSignInHandler } from "./hooks";
import { loginTemplate } from "./ui";

export const Login = async (ctx: RouteCtx): Promise<ElComponent> => {
  const el = document.createElement("div");

  // 既にログイン済みの場合はダッシュボードへリダイレクト
  const isLoggedIn = await ensureAuth();
  if (isLoggedIn) {
    window.location.href = "/dashboard";
    // リダイレクト中は空のコンポーネントを返す
    return pageFactory([componentFactory(el)]);
  }

  const nextUrl = ctx.query.get("next");
  el.innerHTML = loginTemplate(nextUrl);

  useBannerCloseHandler(el);
  useSignInHandler(el, nextUrl);

  return pageFactory([componentFactory(el)]);
};
