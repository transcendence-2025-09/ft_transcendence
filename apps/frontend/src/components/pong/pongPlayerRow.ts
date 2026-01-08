import { componentFactory, type ElComponent, eh } from "@/factory";

// 名前を動的に変えたいので、ElComponent にメソッドを足した拡張型を作る
export type PongPlayerRowComponent = ElComponent & {
  setNames: (left: string, right: string) => void;
};

export const pongPlayerRow = (): PongPlayerRowComponent => {
  const container = eh("div", {
    className: "grid grid-cols-3 items-center text-center w-full flex-shrink-0",
  });

  const player1 = eh(
    "div",
    {
      className:
        "justify-self-start bg-white text-black font-semibold rounded-2xl shadow-lg/20 shadow-black/40 w-36 py-4",
    },
    "Player1",
  );

  const live = eh(
    "div",
    {
      className:
        "justify-self-center text-emerald-300 text-xs font-semibold tracking-wide rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1",
    },
    "LIVE",
  );

  const player2 = eh(
    "div",
    {
      className:
        "justify-self-end bg-white text-black font-semibold rounded-2xl shadow-lg/20 shadow-black/40 w-36 py-4",
    },
    "Player2",
  );

  container.append(player1, live, player2);

  const base = componentFactory(container);

  return {
    ...base,
    setNames(left: string, right: string) {
      player1.textContent = left;
      player2.textContent = right;
    },
  };
};
