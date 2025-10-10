import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";

export const pongGame = (): ElComponent => {
  const canvas = eh("canvas", {
    width: "1000",
    height: "700",
    id: "game",
    className: "mx-auto block bg-black rounded-lg shadow-lg",
  });

  const base = componentFactory(canvas);
  return base;
};
