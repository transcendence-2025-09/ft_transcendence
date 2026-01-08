import { componentFactory, type ElComponent, eh } from "@/factory";

export const pongGame = (): ElComponent => {
  const wrapper = eh("div", {
    className: "w-full flex-1 min-h-0 flex items-center justify-center pb-6",
  });

  const canvas = eh("canvas", {
    id: "game",
    // 属性の width/height は外す or 最小にして、JSで後から決める
    className:
      "block max-h-full max-w-full w-auto h-auto aspect-[16/10] bg-black rounded-lg shadow-lg outline-none",
    style: "border-color: oklch(44.8% 0.119 151.328); border-width: 4px;",
    width: 1920,
    height: 1200,
  });
  wrapper.appendChild(canvas);
  return componentFactory(wrapper);
};
