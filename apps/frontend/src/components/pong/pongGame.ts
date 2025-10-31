import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";

export const pongGame = (): ElComponent => {
  const canvas = eh("canvas", {
    width: "1500",
    height: "1100",
    id: "game",
    className: "mx-auto block bg-black rounded-lg shadow-lg",
  });

  const base = componentFactory(canvas);
  return base;
};
