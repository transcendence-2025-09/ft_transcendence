import { pongBackGroundFactory } from "../components/pong/pongBackGround";
import { pongGame } from "../components/pong/pongGame";
import { pongHeader } from "../components/pong/pongHeader";
import type { PongPlayerRowComponent } from "../components/pong/pongPlayerRow";
import { pongPlayerRow } from "../components/pong/pongPlayerRow";
import type { ElComponent } from "../factory/componentFactory";
import { pageFactory } from "../factory/pageFactory";
import type { RenderOption } from "../logic/pong/pongGame";
import { PongGame } from "../logic/pong/pongGame";
import type { RouteCtx } from "../routing/routeList";
import type { Match } from "./tournaments/types";

const pongPageComp = (ctx?: RouteCtx): ElComponent => {
  const bg = pongBackGroundFactory();
  const content = bg.el.querySelector("#pong-container") as HTMLDivElement;

  const header = pongHeader();
  const playerLow = pongPlayerRow() as PongPlayerRowComponent;
  const pong = pongGame();

  let gameInstance: PongGame | null = null;

  const opt: RenderOption | null = null;

  const getMatchInfo = async (): Promise<Match | null> => {
    const tournamentId = ctx?.params.tournamentId;
    const matchId = ctx?.params.matchId;
    console.log(`tournamentId: ${tournamentId}`);
    console.log(`matchId: ${matchId}`);
    if (!tournamentId || !matchId) {
      console.log("not get match id or tournament Id");
      return null;
    }
    const res = await fetch(
      `/api/tournaments/${tournamentId}/matches/${matchId}`,
      {
        method: "GET",
      },
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to get tournament info");
    }
    const data = await res.json();
    return data.match;
  };

  return {
    el: bg.el,
    mount(target, anchor = null) {
      bg.mount(target, anchor);
      header.mount(content);
      playerLow.mount(content);
      pong.mount(content);

      void (async () => {
        const match = await getMatchInfo();
        if (!match) return;
        const leftPlayerName: string = match.leftPlayer.alias ?? "Left Player";
        const rightPlayerName: string =
          match.rightPlayer.alias ?? "Right Player";
        playerLow.setNames(leftPlayerName, rightPlayerName);

        const canvas = pong.el as HTMLCanvasElement;
        gameInstance = new PongGame(canvas, opt, ctx, match);

        await gameInstance.init().then(() => {
          gameInstance?.start();
        });
      })();
    },
    unmount() {
      if (gameInstance) {
        gameInstance.stop();
        gameInstance.unregisterKeyEvent();
      }
      gameInstance = null;
      pong.unmount();
      playerLow.unmount();
      header.unmount();
      bg.unmount();
    },
  };
};
export const pongPage = (ctx?: RouteCtx) => pageFactory([pongPageComp(ctx)]);
