import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";

export const pongGame = (): ElComponent => {
  const canvas = eh("canvas", {
    id: "game",
    // 属性の width/height は外す or 最小にして、JSで後から決める
    className:
      "mx-auto block w-full max-w-[1000px] aspect-[15/11] bg-black rounded-lg shadow-lg outline-none",
  });
  return componentFactory(canvas);
};

// export const pongGame = (): ElComponent => {
//   const canvas = eh("canvas", {
//     width: "1500",
//     height: "1100",
//     id: "game",
//     className: "mx-auto block bg-black rounded-lg shadow-lg",
//   });
//   const base = componentFactory(canvas);
//   return base;
// };
