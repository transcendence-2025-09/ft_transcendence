import { componentFactory, type ElComponent, eh } from "@/factory";

export const pongGame = (): ElComponent => {
  const canvas = eh("canvas", {
    id: "game",
    // 属性の width/height は外す or 最小にして、JSで後から決める
    className:
      "mx-auto block w-full max-w-[1000px] aspect-[15/11] bg-black rounded-lg shadow-lg outline-none",
  });
  return componentFactory(canvas);
};
