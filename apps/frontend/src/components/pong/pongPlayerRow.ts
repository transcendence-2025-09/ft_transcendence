import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";
import { eh } from "../../factory/elementFactory";

export const pongPlayerRow = (): ElComponent => {
  const container = eh("div", {
    className: "grid grid-cols-3 items-center text-center w-full",
  });

  const player1 = eh(
    "div",
    {
      className:
        "justify-self-start bg-white text-black font-semibold \
		rounded-2xl shadow-lg/20 shadow-black/40 w-36	py-4",
    },
    "Player1",
  );

  const live = eh(
    "div",
    {
      className:
        "justify-self-center text-emerald-300 \
		text-xs font-semibold tracking-wide rounded-full border border-emerald-500/40 \
		bg-emerald-500/10 px-4 py-1",
    },
    "LIVE",
  );

  const player2 = eh(
    "div",
    {
      className:
        "justify-self-end bg-white text-black font-semibold \
		rounded-2xl shadow-lg/20 shadow-black/40 w-36	py-4",
    },
    "Player2",
  );

  container.append(player1, live, player2);
  return componentFactory(container);
};
